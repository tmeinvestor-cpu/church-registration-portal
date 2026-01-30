// =====================================================
// COZA PORTAL - FIXED REGISTRATION HANDLER
// This version ensures images are captured BEFORE submitting
// =====================================================

let videoStream = null;
let video = null;
let captureInProgress = false;
let phoneCheckTimeout = null;

async function checkAIStatus() {
    const statusText = document.getElementById("ai-status");
    const scanBtn = document.getElementById("startScan");

    if (!statusText || !scanBtn) return;

    try {
        const res = await fetch("/api/ai-status");

        if (res.status === 503) {
            statusText.innerText = "🔴 AI temporarily offline";
            statusText.style.backgroundColor = "#ffebee";
            statusText.style.color = "#c62828";
            scanBtn.disabled = true;
            return;
        }

        const data = await res.json();
        statusText.innerText = "🟢 AI online";
        statusText.style.backgroundColor = "#e8f5e9";
        statusText.style.color = "#2e7d32";
        scanBtn.disabled = false;

    } catch (err) {
        console.error("AI status check failed:", err);
        statusText.innerText = "⚠️ Unable to reach AI service";
        statusText.style.backgroundColor = "#fff3e0";
        statusText.style.color = "#e65100";
        scanBtn.disabled = true;
    }
}

// Phone duplicate check function
async function checkPhoneDuplicate() {
    const phoneInput = document.getElementById("phone");
    const phone = phoneInput.value.trim();
    const warningBox = document.getElementById("phoneWarning");
    const countSpan = document.getElementById("phoneCount");

    warningBox.style.display = "none";

    if (phone.length < 10) return;

    try {
        const res = await fetch(`/api/check-phone?phone=${encodeURIComponent(phone)}`);
        const data = await res.json();

        if (data.count > 0) {
            countSpan.textContent = data.count;
            warningBox.style.display = "block";
            console.log(`⚠️ Phone ${phone} used by ${data.count} member(s)`);
        }
    } catch (err) {
        console.error("Phone check failed:", err);
    }
}

// Setup phone listener
function setupPhoneListener() {
    const phoneInput = document.getElementById("phone");

    phoneInput.addEventListener("input", () => {
        clearTimeout(phoneCheckTimeout);
        phoneCheckTimeout = setTimeout(checkPhoneDuplicate, 1000);
    });

    phoneInput.addEventListener("blur", checkPhoneDuplicate);
}


async function startFaceScan() {
    // Prevent multiple clicks
    if (captureInProgress) {
        console.log("⚠️ Capture already in progress");
        return;
    }

    console.log("🎬 Starting face scan...");

    // Validate required fields FIRST
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

    // ADD THIS BEFORE BRANCH CHECK:
    const warningBox = document.getElementById("phoneWarning");
    if (warningBox.style.display === "block") {
        const choice = document.querySelector('input[name="phoneChoice"]:checked').value;
        if (choice === "change") {
            document.getElementById("phone").focus();
            alert("Please enter a different phone number");
            return;
        }
    }

    if (!document.getElementById("branch_id").value) {
        alert("Please select your branch");
        return;
    }

    // Set flag to prevent re-entry
    captureInProgress = true;

    const statusEl = document.getElementById("status");
    const scanBtn = document.getElementById("startScan");

    // Disable button during capture
    scanBtn.disabled = true;
    scanBtn.innerText = "Capturing...";

    video = document.getElementById("video");
    const canvas = document.getElementById("canvas");

    try {
        statusEl.innerText = "📷 Accessing camera...";
        console.log("📷 Requesting camera access...");

        // Request camera access
        videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user",
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        });

        console.log("✅ Camera access granted");
        video.srcObject = videoStream;
        video.style.display = "block";  // Make preview visible during scan

        // Wait for video metadata to load
        await new Promise((resolve, reject) => {
            video.onloadedmetadata = () => {
                console.log(`📹 Video ready: ${video.videoWidth}x${video.videoHeight}`);
                video.play();
                resolve();
            };
            video.onerror = reject;

            // Timeout after 5 seconds
            setTimeout(() => reject(new Error("Video load timeout")), 5000);
        });

        // CRITICAL: Wait for camera to stabilize
        statusEl.innerText = "⏳ Camera stabilizing...";
        console.log("⏳ Waiting for camera to stabilize...");
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Start capturing frames
        statusEl.innerText = "📸 Capturing frames...";
        console.log("📸 Starting frame capture...");

        const ctx = canvas.getContext("2d");
        let frames = [];
        let captured = 0;
        const totalFrames = 5;

        // Capture frames at intervals
        const captureInterval = setInterval(() => {
            // Verify video is actually playing
            if (video.readyState !== video.HAVE_ENOUGH_DATA) {
                console.warn("⚠️ Video not ready yet, skipping frame");
                return;
            }

            // Set canvas size to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Verify video dimensions
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                console.warn("⚠️ Invalid video dimensions, skipping frame");
                return;
            }

            // Draw current video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to base64 with good quality
            const imageData = canvas.toDataURL("image/jpeg", 0.92);

            // Verify we have valid data
            if (imageData && imageData.length > 1000) { // At least 1KB
                frames.push(imageData);
                captured++;
                console.log(`✅ Frame ${captured}/${totalFrames} captured (${imageData.length} chars)`);
                statusEl.innerText = `📸 Captured ${captured}/${totalFrames} frames...`;
            } else {
                console.warn(`⚠️ Frame ${captured + 1} too small or empty`);
            }

            // Check if we have enough frames
            if (captured >= totalFrames) {
                clearInterval(captureInterval);
                console.log(`✅ Capture complete! Got ${frames.length} frames`);

                // Stop camera
                stopCamera();
                video.style.display = "none";  // Hide after capture

                // Use the last (most recent) frame
                const finalImage = frames[frames.length - 1];
                console.log(`📤 Submitting final frame (${finalImage.length} chars)`);

                statusEl.innerText = "🔄 Processing registration...";
                submitRegistration(finalImage);
            }
        }, 300); // Capture every 300ms

        // Safety timeout - stop after 5 seconds even if not enough frames
        setTimeout(() => {
            if (captureInProgress) {
                clearInterval(captureInterval);
                console.log(`⏱️ Timeout: captured ${frames.length} frames`);

                if (frames.length > 0) {
                    stopCamera();
                    submitRegistration(frames[frames.length - 1]);
                } else {
                    stopCamera();
                    alert("Failed to capture image. Please try again.");
                    captureInProgress = false;
                    scanBtn.disabled = false;
                    scanBtn.innerText = "Start Face Scan";
                    statusEl.innerText = "";
                }
            }
        }, 5000);

    } catch (err) {
        console.error("❌ Camera error:", err);
        statusEl.innerText = "";
        captureInProgress = false;
        scanBtn.disabled = false;
        scanBtn.innerText = "Start Face Scan";

        if (err.name === 'NotAllowedError') {
            alert("Camera access denied. Please allow camera permissions.");
        } else if (err.name === 'NotFoundError') {
            alert("No camera found on this device.");
        } else if (err.message === 'Video load timeout') {
            alert("Camera failed to initialize. Please try again.");
        } else {
            alert("Camera error: " + err.message);
        }
    }
}

function stopCamera() {
    console.log("🛑 Stopping camera...");

    if (videoStream) {
        videoStream.getTracks().forEach(t => {
            t.stop();
            console.log(`Stopped track: ${t.kind}`);
        });
        videoStream = null;
    }

    if (video && video.srcObject) {
        video.srcObject = null;
    }
}

async function submitRegistration(imageData) {
    console.log("📤 Submitting registration...");
    console.log(`  Image data length: ${imageData.length} characters`);

    const scanBtn = document.getElementById("startScan");
    const statusEl = document.getElementById("status");

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

    console.log("📋 Payload:", {
        ...payload,
        image: `${imageData.substring(0, 50)}... (${imageData.length} chars total)`
    });

    try {
        const res = await fetch("/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        console.log("📥 Response:", data);

        if (!res.ok) {
            console.error("❌ Registration failed:", data.message);
            alert(data.message || "Registration failed");
            captureInProgress = false;
            scanBtn.disabled = false;
            scanBtn.innerText = "Start Face Scan";
            statusEl.innerText = "";
            return;
        }

        console.log("✅ Registration successful!");
        document.getElementById("formBox").style.display = "none";
        document.getElementById("successBox").style.display = "block";

        // Play success sound
        new Audio('/static/success-chime.mp3').play()
            .then(() => console.log("Success sound played"))
            .catch(err => console.warn("Sound playback failed:", err));

        // Create countdown timer
        let secondsLeft = 6;
        const countdownEl = document.createElement("p");
        countdownEl.id = "countdown";
        countdownEl.style.fontSize = "1.3em";
        countdownEl.style.marginTop = "20px";
        countdownEl.style.textAlign = "center";
        countdownEl.style.color = "#2e7d32";
        countdownEl.textContent = `Returning to registration in ${secondsLeft} seconds...`;
        document.getElementById("successBox").appendChild(countdownEl);

        const timer = setInterval(() => {
            secondsLeft--;
            if (secondsLeft > 0) {
                countdownEl.textContent = `Returning to registration in ${secondsLeft} seconds...`;
            } else {
                clearInterval(timer);
                location.reload();
            }
        }, 1000);

        // Reset button
        const resetBtn = document.createElement("button");
        resetBtn.textContent = "Register Another Person";
        resetBtn.style.marginTop = "30px";
        resetBtn.style.padding = "15px 40px";
        resetBtn.style.fontSize = "1.4em";
        resetBtn.style.backgroundColor = "#2e7d32";
        resetBtn.style.color = "white";
        resetBtn.style.border = "none";
        resetBtn.style.borderRadius = "8px";
        resetBtn.style.cursor = "pointer";
        resetBtn.style.display = "block";
        resetBtn.style.marginLeft = "auto";
        resetBtn.style.marginRight = "auto";
        resetBtn.onclick = () => {
            clearInterval(timer);
            location.reload();
        };
        document.getElementById("successBox").appendChild(resetBtn);


       // Auto-refresh after 3 seconds
      //  setTimeout(() => {
      //      location.reload();
      //  }, 3000);

    } catch (err) {
        console.error("❌ Network error:", err);
        alert("Registration failed. Please check your connection and try again.");
        captureInProgress = false;
        scanBtn.disabled = false;
        scanBtn.innerText = "Start Face Scan";
        statusEl.innerText = "";
    }
}

// =====================================================
// PAGE INITIALIZATION
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Page loaded, initializing...");

    // AI status check
    checkAIStatus();
    setupPhoneListener();
    setInterval(checkAIStatus, 15000);

    // Start face scan button
    const scanBtn = document.getElementById("startScan");
    if (scanBtn) {
        scanBtn.addEventListener("click", startFaceScan);
        console.log("✅ Scan button listener attached");
    } else {
        console.error("❌ Start scan button not found!");
    }

    // Worker → Role visibility + reset ministry if needed
    document.getElementById("is_worker").addEventListener("change", (e) => {
        const roleBox = document.getElementById("roleBox");
        const churchBox = document.getElementById("churchBox");
        const roleSelect = document.getElementById("role");
        const ministryInput = document.getElementById("ministry_name");

        if (e.target.value === "yes") {
            roleBox.style.display = "block";
        } else {
            roleBox.style.display = "none";
            if (roleSelect) roleSelect.value = "";           // Clear role

            // Also hide ministry box and clear input when worker changes to No
            if (churchBox) churchBox.style.display = "none";
            if (ministryInput) ministryInput.value = "";
        }
    });

    // SOP → Ministry visibility (keep this, but add safety)
    document.getElementById("role").addEventListener("change", (e) => {
        const churchBox = document.getElementById("churchBox");
        const ministryInput = document.getElementById("ministry_name");

        if (e.target.value === "sop") {
            churchBox.style.display = "block";
        } else {
            churchBox.style.display = "none";
            if (ministryInput) ministryInput.value = "";     // Clear when role changes away from sop
        }
    });

    console.log("✅ Registration handler initialized");
});
