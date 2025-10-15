# /src/domain/models.py
from pydantic import BaseModel, Field

class ImproveRequest(BaseModel):
    Code: str = Field(..., description="Código fuente a analizar y mejorar")

class ImproveResponse(BaseModel):
    Analisis: str
    Code: str