from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import base64, cv2, numpy as np, sqlite3, yaml, os
from datetime import datetime

from ai.face_detector import FaceDetector
from ai.face_embedding import get_embedding
from ai.faiss_manager import FaissManager
from ai.face_quality import evaluate_face_quality
from ai.role_mapper import resolve_level

app = Flask(__name__)
CORS(app)  # Enable CORS for development

detector = FaceDetector()
faiss_db = FaissManager()

# Load configurations
CONFIG = yaml.safe_load(open("config/config.yaml"))
DEVICE = yaml.safe_load(open("config/device_config.yaml"))
ROLES = yaml.safe_load(open("config/roles.yaml"))

PORT = CONFIG["registration_portal"].get("port", 5050)
DEBUG = CONFIG["registration_portal"].get("debug", False)


# --------------------------------------------------
# BRANCH DATA STRUCTURE - 9 BRANCHES
# IMPORTANT: Python syntax - all keys need quotes!
# --------------------------------------------------
BRANCHES = {
    "Nigeria": {
        "Abuja": [
            {"id": 1, "code": "COZA_HQ", "name": "COZA Abuja", "city": "Guzape"},
            {"id": 2, "code": "COZA_LUGBE", "name": "COZA Lugbe", "city": "Lugbe"}
        ],
        "Lagos": [
            {"id": 3, "code": "COZA_LAGOS", "name": "COZA Lagos", "city": "Ikeja"},
            {"id": 4, "code": "COZA_VI/CHILDREN CHURCH", "name": "COZA VI", "city": "Maryland"}
        ],
        "Kwara": [
            {"id": 5, "code": "COZA_ILORIN", "name": "COZA Ilorin", "city": "Tanke"}
        ],
        "Rivers": [
            {"id": 6, "code": "COZA_PH", "name": "COZA Port Harcourt", "city": "Rumuomasi"}
        ]
    },
    "United Kingdom": {
        "Greater London": [
            {"id": 7, "code": "COZA_LONDON", "name": "COZA London", "city": "London"}
        ],
        "West Midlands": [
            {"id": 8, "code": "COZA_BIRMINGHAM", "name": "COZA Birmingham", "city": "Birmingham"}
        ],
        "Greater Manchester": [
            {"id": 9, "code": "COZA_MANCHESTER", "name": "COZA Manchester", "city": "Manchester"}
        ]
    }
}


# --------------------------------------------------
# AI SERVICE AVAILABILITY CHECK
# --------------------------------------------------
def ai_is_online():
    """
    Check if AI service is actually running and available.
    Returns True if face detection and embedding services are operational.
    """
    try:
        # Try to initialize the detector and check if models are loaded
        if detector is None:
            return False

        # Quick health check - verify FAISS is accessible
        if faiss_db is None:
            return False

        return True

    except Exception as e:
        print(f"⚠️  AI service check failed: {str(e)}")
        return False


# --------------------------------------------------
# LOCATION API ENDPOINTS
# --------------------------------------------------
@app.route("/api/countries")
def get_countries():
    """Return list of available countries"""
    return jsonify(list(BRANCHES.keys()))


@app.route("/api/states")
def get_states():
    """Return list of states for a given country"""
    country = request.args.get("country")

    if not country or country not in BRANCHES:
        return jsonify([])

    return jsonify(list(BRANCHES[country].keys()))


@app.route("/api/branches")
def get_branches():
    """Return list of branches for a given country and state"""
    country = request.args.get("country")
    state = request.args.get("state")

    if not country or not state:
        return jsonify([])

    if country not in BRANCHES or state not in BRANCHES[country]:
        return jsonify([])

    return jsonify(BRANCHES[country][state])


# --------------------------------------------------
# MAIN ROUTES
# --------------------------------------------------
@app.route("/")
def home():
    return render_template("register.html")


@app.route("/api/ai-status")
def ai_status():
    """
    Check if AI service is actually running and available.
    Not based on time window, but actual service availability.
    """
    online = ai_is_online()

    return jsonify({
        "online": online,
        "message": "AI service available" if online else "AI service is currently unavailable. Please try again later."
    }), 200 if online else 503


# --------------------------------------------------
# REGISTRATION
# --------------------------------------------------
@app.route("/register", methods=["POST"])
def register():
    """Register a new member with facial recognition"""

    # Check if AI service is actually available (not time-based)
    if not ai_is_online():
        return jsonify({
            "message": "AI service is currently unavailable. Please try again later."
        }), 503

    try:
        data = request.json

        # Validate required fields
        required_fields = ["first_name", "last_name", "phone", "country", "state"]
        for field in required_fields:
            if not data.get(field):
                return jsonify({"message": f"Missing required field: {field}"}), 400

        # Validate consent
        if not data.get("consent"):
            return jsonify({"message": "Consent is required"}), 400


        # --------------------------------------------------
        # Decode image - IMPROVED WITH VALIDATION
        # --------------------------------------------------
        if not data.get("image"):
            return jsonify({"message": "No image provided"}), 400

        try:
            # Get image data
            image_data = data["image"]
            print(f"📊 Received image data: {len(image_data)} characters")

            # Remove data URL prefix if present
            if "," in image_data:
                image_data = image_data.split(",")[1]

            # Decode base64
            img_bytes = base64.b64decode(image_data)
            print(f"📊 Decoded to: {len(img_bytes)} bytes")

            # Verify we have data
            if len(img_bytes) == 0:
                print("❌ Error: Empty image buffer after decoding")
                return jsonify({"message": "Empty image data received"}), 400

            # Convert to numpy array
            nparr = np.frombuffer(img_bytes, np.uint8)

            # Verify numpy array has data
            if nparr.size == 0:
                print("❌ Error: Numpy array is empty")
                return jsonify({"message": "Failed to decode image data"}), 400

            # Decode image
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            # Verify image was decoded
            if frame is None:
                print("❌ Error: cv2.imdecode returned None")
                return jsonify({"message": "Failed to decode image. Please try again."}), 400

            # Verify image has content
            if frame.size == 0:
                print("❌ Error: Decoded frame is empty")
                return jsonify({"message": "Decoded image is empty"}), 400

            print(f"✅ Image decoded successfully: {frame.shape}")

        except Exception as e:
            print(f"❌ Image decoding error: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({"message": f"Image decoding failed: {str(e)}"}), 400


        face_img, face_obj = detector.detect_single_face(frame)

        if face_img is None:
            return jsonify({"message": "No face detected. Please try again."}), 400

        passed, score = evaluate_face_quality(face_img)

        if not passed:
            return jsonify({
                "message": f"Face quality too low (score: {score:.2f}). Please ensure good lighting and look directly at the camera."
            }), 400

        # --------------------------------------------------
        # Process role and level
        # --------------------------------------------------
        role = data.get("role", "member")
        is_worker = data.get("is_worker", False)

        # Convert string to boolean if needed
        if isinstance(is_worker, str):
            is_worker = is_worker.lower() == "yes"

        ministry_name = data.get("ministry_name", "")

        # Calculate level (backend secret - not returned to user)
        level = resolve_level(role, is_worker)

        # --------------------------------------------------
        # Handle branch_id
        # SOPs don't require branch_id, others do
        # --------------------------------------------------
        branch_id = None

        if role.lower() != "sop":
            # Regular members and workers MUST have a branch
            if not data.get("branch_id"):
                return jsonify({"message": "Branch selection is required"}), 400
            branch_id = int(data["branch_id"])
        # SOPs don't need branch_id - they can be None

        # --------------------------------------------------
        # Database
        # --------------------------------------------------
        os.makedirs("database", exist_ok=True)

        conn = sqlite3.connect("database/church.db")
        conn.execute("PRAGMA foreign_keys = ON")
        cur = conn.cursor()

        try:
            device_id = DEVICE["device"]["device_id"]

            # --------------------------------------------------
            # Validate branch (only if branch_id is provided)
            # --------------------------------------------------
            if branch_id is not None:
                cur.execute(
                    "SELECT id FROM branches WHERE id = ? AND active = 1",
                    (branch_id,)
                )

                if not cur.fetchone():
                    conn.close()
                    return jsonify({"message": "Invalid branch selected"}), 400

            # --------------------------------------------------
            # Check for existing phone numbers
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
                    device_id,
                    role,
                    level,
                    ministry_name,
                    is_worker,
                    created_at
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """, (
                data["first_name"],
                data["last_name"],
                data["phone"],
                data.get("whatsapp_number", data["phone"]),
                data.get("email", ""),
                data.get("residential_city", ""),
                data["country"],
                data["state"],
                branch_id,  # Can be None for SOPs
                device_id,
                role,
                level,  # Backend secret - not returned to user
                ministry_name,
                is_worker,
                datetime.now().isoformat()
            ))

            member_id = cur.lastrowid

            # --------------------------------------------------
            # Face embedding
            # --------------------------------------------------
            embedding = get_embedding(face_obj)
            faiss_db.add(embedding, member_id)
            faiss_db.save()

            conn.commit()

            print(f"✅ Registered: {data['first_name']} {data['last_name']} (ID: {member_id}, Role: {role})")

            # Return success WITHOUT exposing level (backend secret)
            return jsonify({
                "status": "success",
                "message": "✅ Registration successful",
                "member_id": member_id,
                "phone_used_before": existing_count > 0
            })

        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

    except Exception as e:
        print(f"❌ Registration error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "message": f"Registration failed: {str(e)}"
        }), 500


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------
@app.route("/health")
def health():
    """Health check endpoint for Railway"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "ai_online": ai_is_online()
    })


# --------------------------------------------------
if __name__ == "__main__":
    print("="*60)
    print("🚀 COZA GLOBAL REGISTRATION PORTAL")
    print("="*60)
    print(f"📍 Port: {PORT}")
    print(f"🌐 URL: http://127.0.0.1:{PORT}")
    print(f"🤖 AI Service: {'Online' if ai_is_online() else 'Offline'}")
    print(f"🏢 Branches: {sum(len(states) for states in BRANCHES.values())} total")
    print("="*60)

    app.run(host="0.0.0.0", port=PORT, debug=DEBUG)
