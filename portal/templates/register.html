from flask import Flask, request, jsonify, render_template
import base64, cv2, numpy as np, sqlite3, yaml
from datetime import datetime

from ai.face_detector import FaceDetector
from ai.face_embedding import get_embedding
from ai.faiss_manager import FaissManager
from ai.face_quality import evaluate_face_quality

app = Flask(__name__)

detector = FaceDetector()
faiss_db = FaissManager(auto_create=True)

CONFIG = yaml.safe_load(open("config/config.yaml"))
DEVICE = yaml.safe_load(open("config/device_config.yaml"))

PORT = CONFIG["registration_portal"].get("port", 5000)
DEBUG = CONFIG["registration_portal"].get("debug", False)


# --------------------------------------------------
# AI AVAILABILITY WINDOW
# --------------------------------------------------
def ai_is_online():
    if not CONFIG["ai_service_window"]["enabled"]:
        return True

    now = datetime.now().strftime("%H:%M")
    return (
        CONFIG["ai_service_window"]["start_time"]
        <= now
        <= CONFIG["ai_service_window"]["end_time"]
    )


# --------------------------------------------------
# ROUTES
# --------------------------------------------------
@app.route("/")
def home():
    return render_template("register.html")


@app.route("/api/ai-status")
def ai_status():
    return jsonify({
        "online": ai_is_online(),
        "message": CONFIG["ai_service_window"]["offline_message"]
    })


# --------------------------------------------------
# REGISTRATION
# --------------------------------------------------
@app.route("/register", methods=["POST"])
def register():

    if not ai_is_online():
        return jsonify({
            "message": CONFIG["ai_service_window"]["offline_message"]
        }), 503

    data = request.json

    # --------------------------------------------------
    # Decode image
    # --------------------------------------------------
    img_data = base64.b64decode(data["image"].split(",")[1])
    frame = cv2.imdecode(
        np.frombuffer(img_data, np.uint8),
        cv2.IMREAD_COLOR
    )

    face_img, face_obj = detector.detect_single_face(frame)

    if face_img is None:
        return jsonify({"message": "No face detected"}), 400

    passed, score = evaluate_face_quality(face_img)

    if not passed:
        return jsonify({
            "message": f"Face quality too low ({score})"
        }), 400

    # --------------------------------------------------
    # Database
    # --------------------------------------------------
    conn = sqlite3.connect("database/church.db")
    conn.execute("PRAGMA foreign_keys = ON")
    cur = conn.cursor()

    branch_id = int(data["branch_id"])
    device_id = DEVICE["device"]["device_id"]

    # --------------------------------------------------
    # Validate branch
    # --------------------------------------------------
    cur.execute(
        "SELECT id FROM branches WHERE id = ? AND active = 1",
        (branch_id,)
    )

    if not cur.fetchone():
        conn.close()
        return jsonify({"message": "Invalid branch selected"}), 400

    # --------------------------------------------------
    # Phone reuse allowed
    # --------------------------------------------------
    cur.execute(
        "SELECT COUNT(*) FROM members WHERE phone = ?",
        (data["phone"],)
    )

    existing_count = cur.fetchone()[0]

    # --------------------------------------------------
    # Insert member
    # --------------------------------------------------
    cur.execute("""
        INSERT INTO members (
            first_name,
            last_name,
            phone,
            whatsapp_number,
            email,
            residential_city,
            country,
            state,
            branch_id,
            device_id
        ) VALUES (?,?,?,?,?,?,?,?,?,?)
    """, (
        data["first_name"],
        data["last_name"],
        data["phone"],
        data.get("whatsapp_number", data["phone"]),
        data.get("email"),
        data.get("residential_city"),
        data["country"],
        data["state"],
        branch_id,
        device_id
    ))

    member_id = cur.lastrowid

    # --------------------------------------------------
    # Face embedding
    # --------------------------------------------------
    embedding = get_embedding(face_obj)
    faiss_db.add(embedding, member_id)
    faiss_db.save()

    conn.commit()
    conn.close()

    return jsonify({
        "message": "✅ Registration successful",
        "phone_used_before": existing_count > 0,
        "existing_count": existing_count
    })


# --------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=DEBUG)
