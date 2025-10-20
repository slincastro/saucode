# /src/domain/models.py
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class Metrics(BaseModel):
    method_number: int = Field(0, description="Number of methods/functions in the code")
    number_of_ifs: int = Field(0, description="Number of if statements in the code")
    number_of_loops: int = Field(0, description="Number of loops in the code")
    cyclomatic_complexity: int = Field(1, description="Cyclomatic complexity of the code")
    average_method_size: float = Field(0.0, description="Average number of lines of code per method")
    max_nesting: int = Field(0, description="Maximum nesting level in the code")

class MetricsResponse(BaseModel):
    before: Metrics = Field(Metrics(), description="Metrics before code improvement")
    after: Metrics = Field(Metrics(), description="Metrics after code improvement")

class ImproveRequest(BaseModel):
    Code: str = Field(..., description="Código fuente a analizar y mejorar")
    Tests: Optional[str] = Field(None, description="Pruebas asociadas al código para considerar en la mejora")

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
