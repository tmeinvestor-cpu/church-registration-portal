const btn = document.getElementById("registerBtn");
const statusText = document.getElementById("status");
const aiStatus = document.getElementById("ai-status");

const isWorker = document.getElementById("is_worker");
const roleBox = document.getElementById("roleBox");
const roleSelect = document.getElementById("role");
const churchBox = document.getElementById("churchBox");

let aiOnline = false;

/* ----------------------------------
   AI STATUS CHECK
---------------------------------- */
fetch("/api/ai-status")
    .then(r => r.json())
    .then(data => {
        aiOnline = data.online;

        aiStatus.innerText = data.online
            ? "🟢 AI Online"
            : "🔴 AI Offline — Registration paused";

        if (data.online) {
            startCamera();
        }
    });

/* ----------------------------------
   WORKER LOGIC
---------------------------------- */
isWorker.addEventListener("change", () => {
    if (isWorker.value === "yes") {
        roleBox.style.display = "block";
    } else {
        roleBox.style.display = "none";
        churchBox.style.display = "none";
    }
});

/* ----------------------------------
   ROLE LOGIC
---------------------------------- */
roleSelect.addEventListener("change", () => {
    if (roleSelect.value === "sop") {
        churchBox.style.display = "block";
    } else {
        churchBox.style.display = "none";
    }
});

/* ----------------------------------
   FORM VALIDATION
---------------------------------- */
document.addEventListener("input", () => {
    const ok =
        aiOnline &&
        document.getElementById("consent").checked &&
        document.getElementById("first_name").value &&
        document.getElementById("last_name").value &&
        document.getElementById("phone").value &&
        document.getElementById("branch_id").value;

    btn.disabled = !ok;
});

/* ----------------------------------
   SUBMIT
---------------------------------- */
btn.onclick = async () => {

    statusText.innerText = "Capturing face...";

    const image = captureImage();

    const payload = {
        image,
        first_name: first_name.value,
        last_name: last_name.value,
        phone: phone.value,
        whatsapp_number: whatsapp.value,
        email: email.value,
        residential_city: residential_city.value,
        country: country.value,
        state: state.value,
        branch_id: branch_id.value,
        is_worker: isWorker.value,
        role: roleSelect.value,
        ministry_name: ministry_name?.value || null
    };

    const res = await fetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.status === "success") {
        document.getElementById("formBox").style.display = "none";
        document.getElementById("successBox").style.display = "block";

        setTimeout(() => {
            window.location.reload();
        }, 3500);
    } else {
        statusText.innerText = data.message;
    }
};
