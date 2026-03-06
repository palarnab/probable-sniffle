from __future__ import annotations

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    image: str = Field(..., description="Base64-encoded raw DICOM file buffer")
    modality: str = Field(default="Unknown", description="DICOM modality code")


class Finding(BaseModel):
    condition: str
    probability: float
    confidenceLevel: str
    abnormal: bool


class ModelInfo(BaseModel):
    name: str
    version: str
    confidenceThreshold: float


class AnalyzeResponse(BaseModel):
    model: ModelInfo
    findings: list[Finding]
    normalProbability: float
    heatmapAvailable: bool
    heatmapBase64: str | None = None


class HealthResponse(BaseModel):
    status: str
    device: str
    modelLoaded: bool
