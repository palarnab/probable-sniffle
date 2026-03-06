from __future__ import annotations

import base64
import io
import logging
from typing import Any

import cv2
import numpy as np
import torch
import torch.nn as nn

logger = logging.getLogger(__name__)


def _get_layer(model: nn.Module, layer_name: str) -> nn.Module:
    """Resolve a dot-separated layer name to the actual module."""
    module = model
    for part in layer_name.split("."):
        module = getattr(module, part)
    return module


def generate_gradcam(
    model: nn.Module,
    tensor: torch.Tensor,
    device: torch.device,
    original_image: np.ndarray,
    target_layer_name: str,
) -> str | None:
    """Produce a Grad-CAM heatmap blended with the original image, returned as base64 PNG.

    Returns ``None`` on any failure so the caller can degrade gracefully.
    """

    forward_hook: Any = None
    backward_hook: Any = None
    activations: list[torch.Tensor] = []
    gradients: list[torch.Tensor] = []

    try:
        target_layer = _get_layer(model, target_layer_name)

        def _save_activation(_mod: nn.Module, _inp: Any, output: torch.Tensor) -> None:
            activations.append(output.detach())

        def _save_gradient(_mod: nn.Module, _grad_in: Any, grad_out: tuple[torch.Tensor, ...]) -> None:
            gradients.append(grad_out[0].detach())

        forward_hook = target_layer.register_forward_hook(_save_activation)
        backward_hook = target_layer.register_full_backward_hook(_save_gradient)

        input_tensor = tensor.clone().to(device).requires_grad_(True)

        model.zero_grad()
        output = model(input_tensor)
        probs = torch.sigmoid(output)

        target_class = int(probs.squeeze(0).argmax())
        score = probs[0, target_class]
        score.backward()

        if not activations or not gradients:
            logger.warning("Grad-CAM: no activations/gradients captured")
            return None

        grads = gradients[0]   # (1, C, H, W)
        acts = activations[0]  # (1, C, H, W)

        weights = grads.mean(dim=(2, 3), keepdim=True)  # global average pool
        cam = (weights * acts).sum(dim=1, keepdim=True)  # weighted combination
        cam = torch.relu(cam)
        cam = cam.squeeze().cpu().numpy()

        if cam.max() > 0:
            cam = cam / cam.max()

        h, w = original_image.shape[:2]
        heatmap = cv2.resize(cam.astype(np.float32), (w, h))
        heatmap_colour = cv2.applyColorMap(
            (heatmap * 255).astype(np.uint8), cv2.COLORMAP_JET
        )

        if original_image.ndim == 2:
            base_img = cv2.cvtColor(original_image, cv2.COLOR_GRAY2BGR)
        else:
            base_img = original_image

        blended = cv2.addWeighted(heatmap_colour, 0.4, base_img, 0.6, 0)

        _, png_buf = cv2.imencode(".png", blended)
        b64_str = base64.b64encode(png_buf.tobytes()).decode("ascii")

        logger.info(
            "Grad-CAM generated for class index %d (cam size %dx%d)",
            target_class, w, h,
        )
        return b64_str

    except Exception:
        logger.warning("Grad-CAM generation failed — skipping heatmap", exc_info=True)
        return None

    finally:
        if forward_hook is not None:
            forward_hook.remove()
        if backward_hook is not None:
            backward_hook.remove()
