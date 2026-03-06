from __future__ import annotations

import io
import logging

import cv2
import numpy as np
import pydicom
import torch

logger = logging.getLogger(__name__)

IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)


def preprocess_dicom(dicom_bytes: bytes) -> tuple[np.ndarray, pydicom.Dataset]:
    """Parse raw DICOM bytes and return a normalised uint8 pixel array plus the dataset."""

    ds = pydicom.dcmread(io.BytesIO(dicom_bytes))

    if not hasattr(ds, "pixel_array"):
        raise ValueError("DICOM file does not contain pixel data")

    pixels = ds.pixel_array.astype(np.float64)

    photometric = getattr(ds, "PhotometricInterpretation", "MONOCHROME2")
    if photometric == "MONOCHROME1":
        pixels = pixels.max() - pixels

    p_min, p_max = pixels.min(), pixels.max()
    if p_max - p_min > 0:
        pixels = (pixels - p_min) / (p_max - p_min) * 255.0
    else:
        pixels = np.zeros_like(pixels, dtype=np.float64)

    normalized = pixels.astype(np.uint8)

    if normalized.ndim == 3:
        normalized = cv2.cvtColor(normalized, cv2.COLOR_RGB2GRAY)

    logger.debug(
        "DICOM preprocessed: shape=%s, photometric=%s", normalized.shape, photometric
    )
    return normalized, ds


def prepare_tensor(
    image: np.ndarray, target_size: tuple[int, int] = (224, 224)
) -> torch.Tensor:
    """Resize, normalise, and convert a grayscale uint8 image to a model-ready tensor."""

    resized = cv2.resize(image, target_size, interpolation=cv2.INTER_LINEAR)

    rgb = np.stack([resized] * 3, axis=-1).astype(np.float32) / 255.0

    rgb = (rgb - IMAGENET_MEAN) / IMAGENET_STD

    tensor = torch.from_numpy(rgb.transpose(2, 0, 1))  # HWC → CHW
    tensor = tensor.unsqueeze(0)  # add batch dim
    return tensor
