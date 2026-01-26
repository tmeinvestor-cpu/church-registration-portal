const video = document.getElementById("video");
const statusText = document.getElementById("status");
const registerBtn = document.getElementById("registerBtn");

async function checkAI() {
    const res = await fetch("/api/ai-status");
    const data = await res.json();

    if (!data.online) {
        document.getElementById("ai-status").innerText =
            "AI registration available between 9am–4pm.";
        return;
    }

    registerBtn.disabled = false;
    document.getElementById("ai-status").innerText =
        "Face scan ready. Please look at the camera.";
}

navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => video.srcObject = stream);

registerBtn.onclick = async () => {

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const image = canvas.toDataURL("image/jpeg");

    const payload = {
        first_name: first_name.value,
        last_name: last_name.value,

        phone: phone.value,
        whatsapp_number: whatsapp.value || phone.value,
        email: email.value,

        residential_city: residential_city.value,

        country: country.value,
        state: state.value,
        branch_id: branch_id.value,

        image: image
    };

    const res = await fetch("/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    statusText.innerText = data.message;
};

checkAI();
