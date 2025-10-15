# /src/domain/models.py
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class Metrics(BaseModel):
    method_number: int = Field(0, description="Number of methods/functions in the code")

class MetricsResponse(BaseModel):
    before: Metrics = Field(Metrics(), description="Metrics before code improvement")
    after: Metrics = Field(Metrics(), description="Metrics after code improvement")

class ImproveRequest(BaseModel):
    Code: str = Field(..., description="Código fuente a analizar y mejorar")

class RetrieveContextRequest(BaseModel):
    Query: str = Field(..., description="Consulta para recuperar contexto")

class ChunkDetail(BaseModel):
    score: float
    page: Optional[int] = None
    chunk_id: Optional[str] = None
    text: str

class RetrieveContextResponse(BaseModel):
    RetrievedContext: List[ChunkDetail] = []

class ImproveResponse(BaseModel):
    Analisis: str
    Code: str
    RetrievedContext: List[ChunkDetail] = []
    metrics: Optional[MetricsResponse] = None
