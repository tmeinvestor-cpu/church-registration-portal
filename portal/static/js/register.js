const registerBtn = document.getElementById("registerBtn");
const statusText = document.getElementById("status");

registerBtn.onclick = async () => {

    if (!document.getElementById("consent").checked) {
        alert("Consent is required.");
        return;
    }

    statusText.innerText = "Processing face...";

    const canvas = document.getElementById("canvas");
    const imageData = canvas.toDataURL("image/jpeg");

    const payload = {
        image: imageData,
        first_name: document.getElementById("first_name").value,
        last_name: document.getElementById("last_name").value,
        phone: document.getElementById("phone").value,
        whatsapp_number: document.getElementById("whatsapp").value,
        email: document.getElementById("email").value,
        residential_city: document.getElementById("residential_city").value,
        country: document.getElementById("country").value,
        state: document.getElementById("state").value,
        branch_id: document.getElementById("branch_id").value
    };

    const response = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
        document.getElementById("formBox").style.display = "none";
        document.getElementById("successBox").style.display = "block";

        setTimeout(() => {
            window.location.reload();
        }, 3500);

    } else {
        statusText.innerText = data.message;
    }
};
