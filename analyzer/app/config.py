from __future__ import annotations

import os
from pathlib import Path

import torch
from dotenv import load_dotenv

_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_PATH)


class Settings:
    """Centralised application settings populated from environment variables."""

    host: str = os.getenv("HOST", "0.0.0.0")
    port: int = int(os.getenv("PORT", "4000"))
    log_level: str = os.getenv("LOG_LEVEL", "info")

    model_name: str = os.getenv("MODEL_NAME", "DenseNet121-CheXNet")
    model_version: str = os.getenv("MODEL_VERSION", "1.0.0")
    confidence_threshold: float = float(os.getenv("CONFIDENCE_THRESHOLD", "0.3"))

    enable_gradcam: bool = os.getenv("ENABLE_GRADCAM", "true").lower() == "true"
    gradcam_layer: str = os.getenv(
        "GRADCAM_LAYER", "features.denseblock4.denselayer16.conv2"
    )

    weights_dir: Path = Path(os.getenv("WEIGHTS_DIR", "./weights"))
    heatmap_colormap: str = os.getenv("HEATMAP_COLORMAP", "jet")

    @staticmethod
    def resolve_device() -> torch.device:
        raw = os.getenv("DEVICE", "auto").lower()
        if raw == "auto":
            return torch.device("cuda" if torch.cuda.is_available() else "cpu")
        return torch.device(raw)

    device: torch.device = None  # type: ignore[assignment]

    def __init__(self) -> None:
        self.device = self.resolve_device()


settings = Settings()
