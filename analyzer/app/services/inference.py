from __future__ import annotations

import logging

import torch
import torch.nn as nn

from app.schemas import Finding

logger = logging.getLogger(__name__)


def _confidence_level(probability: float) -> str:
    if probability > 0.7:
        return "High"
    if probability > 0.4:
        return "Moderate"
    if probability > 0.2:
        return "Low"
    return "Very Low"


def run_inference(
    model: nn.Module,
    tensor: torch.Tensor,
    device: torch.device,
    labels: list[str],
    threshold: float,
) -> tuple[list[Finding], float]:
    """Run a forward pass and return structured findings plus a normal-probability score."""

    tensor = tensor.to(device)

    with torch.no_grad():
        logits = model(tensor)
        probabilities = torch.sigmoid(logits).squeeze(0).cpu().numpy()

    findings: list[Finding] = []
    for label, prob in zip(labels, probabilities):
        prob_val = float(prob)
        findings.append(
            Finding(
                condition=label,
                probability=round(prob_val, 4),
                confidenceLevel=_confidence_level(prob_val),
                abnormal=prob_val > threshold,
            )
        )

    findings.sort(key=lambda f: f.probability, reverse=True)

    max_prob = float(probabilities.max()) if len(probabilities) > 0 else 0.0
    normal_probability = round(1.0 - max_prob, 4)

    logger.info(
        "Inference complete: %d findings above threshold, normalProb=%.4f",
        sum(1 for f in findings if f.abnormal),
        normal_probability,
    )
    return findings, normal_probability
