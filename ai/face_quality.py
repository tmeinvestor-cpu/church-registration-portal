# ai/face_quality.py
# ======================================================
# FACE QUALITY VALIDATION ENGINE — PRODUCTION
# ======================================================

import cv2
import numpy as np


def evaluate_face_quality(face_img, landmarks=None):
    """
    Returns:
        {
            passed: bool,
            score: float (0–1),
            blur: float,
            brightness: float,
            area_ratio: float,
            reasons: list[str]
        }
    """

    reasons = []

    # --------------------------------------------------
    # Preprocessing
    # --------------------------------------------------
    gray = cv2.cvtColor(face_img, cv2.COLOR_BGR2GRAY)

    h, w = gray.shape
    img_h, img_w = face_img.shape[:2]

    # --------------------------------------------------
    # Metrics
    # --------------------------------------------------
    blur = cv2.Laplacian(gray, cv2.CV_64F).var()
    brightness = np.mean(gray)

    face_area = h * w
    full_area = img_h * img_w
    area_ratio = face_area / full_area

    # --------------------------------------------------
    # Threshold rules
    # --------------------------------------------------
    if blur < 100:
        reasons.append("Image blurry — hold camera steady")

    if brightness < 80:
        reasons.append("Image too dark — increase lighting")

    if brightness > 200:
        reasons.append("Image too bright — reduce light")

    if area_ratio < 0.35:
        reasons.append("Face too far — move closer to camera")

    # --------------------------------------------------
    # Overall pass/fail
    # --------------------------------------------------
    passed = (
        blur >= 100
        and 80 <= brightness <= 200
        and area_ratio >= 0.35
    )

    # --------------------------------------------------
    # Quality score (0.0 → 1.0)
    # --------------------------------------------------
    score = (
        min(blur / 300, 1.0) * 0.4 +
        (1 - abs(brightness - 130) / 130) * 0.3 +
        min(area_ratio / 0.5, 1.0) * 0.3
    )

    score = round(max(min(score, 1.0), 0.0), 3)

    # --------------------------------------------------
    return {
        "passed": passed,
        "score": score,
        "blur": round(blur, 2),
        "brightness": round(brightness, 2),
        "area_ratio": round(area_ratio, 3),
        "reasons": reasons
    }
