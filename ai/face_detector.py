"""
face_detector.py
------------------

Purpose:
• Detect only ONE face
• Reject background faces
• Crop face automatically
• Prevent group photo registration
• Prepare image for embedding

Uses:
• InsightFace (RetinaFace)

"""

import cv2
import numpy as np
from insightface.app import FaceAnalysis


class FaceDetector:

    def __init__(self):
        """
        Initialize InsightFace model
        """
        self.app = FaceAnalysis(
            name="buffalo_l",
            providers=["CPUExecutionProvider"]
        )

        self.app.prepare(ctx_id=0, det_size=(640, 640))

    def detect_single_face(self, image_bgr):
        """
        Detect exactly one face.

        Returns:
            face_image (numpy array)
            face_object (InsightFace face)
        """

        faces = self.app.get(image_bgr)

        # ❌ No face
        if len(faces) == 0:
            return None, "No face detected"

        # ❌ More than one face
        if len(faces) > 1:
            return None, "Multiple faces detected. Please stay alone."

        face = faces[0]

        # Bounding box
        x1, y1, x2, y2 = map(int, face.bbox)

        # Safety clamp
        h, w, _ = image_bgr.shape
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(w, x2)
        y2 = min(h, y2)

        face_crop = image_bgr[y1:y2, x1:x2]

        # ❌ Face too small
        if face_crop.shape[0] < 80 or face_crop.shape[1] < 80:
            return None, "Face too far from camera"

        return face_crop, face


# -------------------------
# TEST MODE
# -------------------------
if __name__ == "__main__":

    detector = FaceDetector()

    cap = cv2.VideoCapture(0)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        face_img, status = detector.detect_single_face(frame)

        if face_img is not None:
            cv2.putText(
                frame,
                "FACE OK",
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 255, 0),
                2
            )
        else:
            cv2.putText(
                frame,
                status,
                (20, 40),
                cv2.FONT_HERSHEY_SIMPLEX,
                1,
                (0, 0, 255),
                2
            )

        cv2.imshow("Face Registration Test", frame)

        if cv2.waitKey(1) == 27:
            break

    cap.release()
    cv2.destroyAllWindows()
