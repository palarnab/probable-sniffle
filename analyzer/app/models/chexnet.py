from __future__ import annotations

import logging
from pathlib import Path

import torch
import torch.nn as nn
from torchvision.models import densenet121, DenseNet121_Weights

from app.config import settings

logger = logging.getLogger(__name__)

NUM_CLASSES = 14

PATHOLOGY_LABELS: list[str] = [
    "Atelectasis",
    "Cardiomegaly",
    "Effusion",
    "Infiltration",
    "Mass",
    "Nodule",
    "Pneumonia",
    "Pneumothorax",
    "Consolidation",
    "Edema",
    "Emphysema",
    "Fibrosis",
    "Pleural Thickening",
    "Hernia",
]


def load_model(device: torch.device) -> nn.Module:
    """Build a DenseNet-121 with a 14-class classifier head and load weights."""

    model = densenet121(weights=DenseNet121_Weights.IMAGENET1K_V1)

    in_features = model.classifier.in_features
    model.classifier = nn.Sequential(
        nn.Linear(in_features, NUM_CLASSES),
    )

    weights_path = Path(settings.weights_dir) / "chexnet.pth"
    if weights_path.is_file():
        logger.info("Loading CheXNet weights from %s", weights_path)
        state_dict = torch.load(weights_path, map_location=device, weights_only=True)
        model.load_state_dict(state_dict, strict=False)
        logger.info("CheXNet weights loaded successfully")
    else:
        logger.warning(
            "CheXNet weights not found at %s — using ImageNet backbone only "
            "(predictions will not be clinically meaningful)",
            weights_path,
        )

    model = model.to(device)
    model.eval()
    return model
