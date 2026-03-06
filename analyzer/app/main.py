from __future__ import annotations

import base64
import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

import torch.nn as nn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.models.chexnet import PATHOLOGY_LABELS, load_model
from app.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    Finding,
    HealthResponse,
    ModelInfo,
)
from app.services.gradcam import generate_gradcam
from app.services.inference import run_inference
from app.services.preprocessing import preprocess_dicom, prepare_tensor

logger = logging.getLogger(__name__)

_model: nn.Module | None = None


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncIterator[None]:
    global _model
    logging.basicConfig(
        level=settings.log_level.upper(),
        format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    )
    logger.info("Device resolved to: %s", settings.device)
    logger.info("Loading model %s v%s …", settings.model_name, settings.model_version)
    _model = load_model(settings.device)
    logger.info("Model ready on %s", settings.device)
    yield
    logger.info("Shutting down analyzer service")


app = FastAPI(
    title="Radiology Copilot — AI Analyzer",
    version=settings.model_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        device=str(settings.device),
        modelLoaded=_model is not None,
    )


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest) -> AnalyzeResponse:
    if _model is None:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    try:
        dicom_bytes = base64.b64decode(req.image)
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail=f"Invalid base64 image data: {exc}"
        ) from exc

    try:
        pixel_array, _ds = preprocess_dicom(dicom_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Failed to parse DICOM file: {exc}",
        ) from exc

    tensor = prepare_tensor(pixel_array)

    findings, normal_prob = run_inference(
        model=_model,
        tensor=tensor,
        device=settings.device,
        labels=PATHOLOGY_LABELS,
        threshold=settings.confidence_threshold,
    )

    heatmap_b64: str | None = None
    if settings.enable_gradcam:
        heatmap_b64 = generate_gradcam(
            model=_model,
            tensor=tensor,
            device=settings.device,
            original_image=pixel_array,
            target_layer_name=settings.gradcam_layer,
        )

    return AnalyzeResponse(
        model=ModelInfo(
            name=settings.model_name,
            version=settings.model_version,
            confidenceThreshold=settings.confidence_threshold,
        ),
        findings=findings,
        normalProbability=normal_prob,
        heatmapAvailable=heatmap_b64 is not None,
        heatmapBase64=heatmap_b64,
    )
