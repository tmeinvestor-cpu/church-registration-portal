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
        first_name: document.getElementById("first_name").value,
        last_name: document.getElementById("last_name").value,
        phone: document.getElementById("phone").value,
        whatsapp_number: document.getElementById("whatsapp").value,
        email: document.getElementById("email").value,
        residential_city: document.getElementById("city").value,
        branch_id: document.getElementById("branch").value,
        role: document.getElementById("role").value,
        is_worker: document.getElementById("worker").value,
        consent: document.getElementById("consent").checked,
        image: imageData
    };

    const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    alert(data.message || "Registration complete");
}

document.addEventListener("DOMContentLoaded", () => {
    checkAIStatus();
    setInterval(checkAIStatus, 15000);

    document
        .getElementById("startScan")
        .addEventListener("click", startFaceScan);
});
