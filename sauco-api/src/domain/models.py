# /src/domain/models.py
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class ImproveRequest(BaseModel):
    Code: str = Field(..., description="Código fuente a analizar y mejorar")

class ChunkDetail(BaseModel):
    score: float
    page: Optional[int] = None
    chunk_id: Optional[str] = None
    text: str

class ImproveResponse(BaseModel):
    Analisis: str
    Code: str
    RetrievedContext: List[ChunkDetail] = []
