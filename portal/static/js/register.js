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
        statusText.innerText = "⚠️ Unable to reach AI service";
        scanBtn.disabled = true;
    }
}

async function startFaceScan() {
    if (captureInProgress) return;
    captureInProgress = true;

    video = document.createElement("video");
    video.autoplay = true;
    video.playsInline = true;

    videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false
    });

    video.srcObject = videoStream;

    const canvas = document.createElement("canvas");
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
            submitRegistration(frames[frames.length - 1]);
        }
    }, 300);
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
        whatsapp_number: document.getElementById("whatsapp").value.trim(),
        email: document.getElementById("email").value.trim(),

        residential_city: document.getElementById("residential_city").value,
        country: document.getElementById("country").value,
        state: document.getElementById("state").value,

        branch_id: document.getElementById("branch_id").value,
        is_worker: document.getElementById("is_worker").value === "yes",
        role: document.getElementById("role").value,
        ministry_name: document.getElementById("ministry_name")?.value || "",

        consent: document.getElementById("consent").checked,
        image: imageData
    };

    const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
        alert(data.error || "Registration failed");
        return;
    }

    document.getElementById("formBox").style.display = "none";
    document.getElementById("successBox").style.display = "block";
}
