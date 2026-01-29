let videoStream = null;
let video = null;
let captureInProgress = false;

async function checkAIStatus() {
    const statusText = document.getElementById("ai-status");
    const scanBtn = document.getElementById("startScan");

    try {
        const res = await fetch("/api/ai-status");

        if (res.status === 503) {
            statusText.innerText = "🔴 AI temporarily offline";
            scanBtn.disabled = true;
            return;
        }

        const data = await res.json();
        statusText.innerText = "🟢 AI online";
        scanBtn.disabled = false;

    } catch (err) {
        console.error("AI status check failed:", err);
        statusText.innerText = "⚠️ Unable to reach AI service";
        scanBtn.disabled = true;
    }
}

async function startFaceScan() {
    if (captureInProgress) return;

    // Validate required fields
    if (!document.getElementById("consent").checked) {
        alert("Please provide consent for facial recognition");
        return;
    }

    if (!document.getElementById("first_name").value.trim()) {
        alert("Please enter your first name");
        return;
    }

    if (!document.getElementById("last_name").value.trim()) {
        alert("Please enter your last name");
        return;
    }

    if (!document.getElementById("phone").value.trim()) {
        alert("Please enter your phone number");
        return;
    }

    if (!document.getElementById("branch_id").value) {
        alert("Please select your branch");
        return;
    }

    captureInProgress = true;

    video = document.getElementById("video");
    const canvas = document.getElementById("canvas");

    try {
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: false
        });

        video.srcObject = videoStream;

        const ctx = canvas.getContext("2d");
        let frames = [];
        let captured = 0;

        const captureInterval = setInterval(() => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            ctx.drawImage(video, 0, 0);
            frames.push(canvas.toDataURL("image/jpeg"));

            captured++;

            if (captured >= 5) {
                clearInterval(captureInterval);
                stopCamera();
                submitRegistration(frames.at(-1));
            }
        }, 300);
    } catch (err) {
        console.error("Camera access failed:", err);
        alert("Failed to access camera. Please allow camera permissions.");
        captureInProgress = false;
    }
}

function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(t => t.stop());
    }
    captureInProgress = false;
}

async function submitRegistration(imageData) {
    const payload = {
        first_name: document.getElementById("first_name").value.trim(),
        last_name: document.getElementById("last_name").value.trim(),
        phone: document.getElementById("phone").value.trim(),
        whatsapp_number: document.getElementById("whatsapp").value.trim() || document.getElementById("phone").value.trim(),
        email: document.getElementById("email").value.trim(),

        residential_city: document.getElementById("residential_city").value.trim(),
        country: document.getElementById("country").value,
        state: document.getElementById("state").value,

        branch_id: document.getElementById("branch_id").value,
        is_worker: document.getElementById("is_worker").value === "yes",
        role: document.getElementById("role").value || "member",
        ministry_name: document.getElementById("ministry_name")?.value || "",

        consent: document.getElementById("consent").checked,
        image: imageData
    };

    try {
        const res = await fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.message || data.error || "Registration failed");
            return;
        }

        document.getElementById("formBox").style.display = "none";
        document.getElementById("successBox").style.display = "block";

        // Auto-refresh after 3 seconds for next registration
        setTimeout(() => {
            location.reload();
        }, 3000);

    } catch (err) {
        console.error("Registration failed:", err);
        alert("Registration failed. Please try again.");
    }
}

// =====================================================
// PAGE INITIALIZATION
// =====================================================
document.addEventListener("DOMContentLoaded", () => {

    // -----------------------------------
    // AI status check
    // -----------------------------------
    checkAIStatus();
    setInterval(checkAIStatus, 15000);

    // -----------------------------------
    // Start face scan button - FIXED ID
    // -----------------------------------
    document
        .getElementById("startScan")
        .addEventListener("click", startFaceScan);

    // -----------------------------------
    // Worker → Role logic
    // -----------------------------------
    document
        .getElementById("is_worker")
        .addEventListener("change", (e) => {

            const roleBox = document.getElementById("roleBox");

            if (e.target.value === "yes") {
                roleBox.style.display = "block";
            } else {
                roleBox.style.display = "none";
                // Reset role when worker is set to no
                document.getElementById("role").value = "";
            }
        });

    // -----------------------------------
    // SOP → Ministry logic
    // -----------------------------------
    document
        .getElementById("role")
        .addEventListener("change", (e) => {

            const churchBox = document.getElementById("churchBox");

            if (e.target.value === "sop") {
                churchBox.style.display = "block";
            } else {
                churchBox.style.display = "none";
                // Reset ministry name when role changes
                if (document.getElementById("ministry_name")) {
                    document.getElementById("ministry_name").value = "";
                }
            }
        });

});
