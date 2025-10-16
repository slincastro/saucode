# api.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import os
import pickle

from qdrant_client import QdrantClient
from src.service.improvement_service import ImprovementService
from src.domain.models import ImproveRequest, ImproveResponse, RetrieveContextRequest, RetrieveContextResponse
from sklearn.feature_extraction.text import TfidfVectorizer

app = FastAPI(title="Code Improver API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY")  
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "code_knowledge")
TFIDF_VECTORIZER_PATH = os.getenv("TFIDF_VECTORIZER_PATH")  # ej: ./vectorizer.pkl

_vectorizer = None
if TFIDF_VECTORIZER_PATH and os.path.exists(TFIDF_VECTORIZER_PATH):
    with open(TFIDF_VECTORIZER_PATH, "rb") as f:
        _vectorizer = pickle.load(f)

_qdrant = QdrantClient(url=QDRANT_URL, api_key=QDRANT_API_KEY) if QDRANT_URL else None

_service = ImprovementService(
    openai_model=OPENAI_MODEL,
    qdrant_client=_qdrant,
    qdrant_collection=QDRANT_COLLECTION,
    vectorizer=_vectorizer,
)


@app.get("/health")
def health_check():
    """
    Health check endpoint to verify the API is running correctly.
    Returns a 200 OK status code with basic health information.
    """
    return {
        "status": "healthy",
        "api": "sauco-api",
        "version": "1.0.0"
    }

@app.post("/improve", response_model=ImproveResponse)
async def improve(req: ImproveRequest):
    try:
        analysis, improved_code, chunk_details, metrics = await _service.run_workflow(req.Code)
        
        retrieved_context = [
            {
                "score": chunk.get("score", 0.0),
                "page": chunk.get("page"),
                "chunk_id": chunk.get("chunk_id"),
                "text": chunk.get("text", "")
            }
            for chunk in chunk_details
        ]
        
        return ImproveResponse(
            Analisis=analysis, 
            Code=improved_code,
            RetrievedContext=retrieved_context,
            metrics=metrics
        )
    except Exception as e:
        print(f" Error 500 - {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/retrieve_context", response_model=RetrieveContextResponse)
async def retrieve_context(req: RetrieveContextRequest):
    try:
        # Call the _retrieve_context method from the service
        _, chunk_details = _service._retrieve_context(req.Query)
        
        # Format the response
        retrieved_context = [
            {
                "score": chunk.get("score", 0.0),
                "page": chunk.get("page"),
                "chunk_id": chunk.get("chunk_id"),
                "text": chunk.get("text", "")
            }
            for chunk in chunk_details
        ]
        
        return RetrieveContextResponse(
            RetrievedContext=retrieved_context
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
