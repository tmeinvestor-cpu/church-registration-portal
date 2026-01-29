// Branch data structure
const BRANCHES = {
    "Nigeria": {
        "Abuja": [
            { id: 1, code: "COZA_HQ", name: "COZA Abuja", city: "Guzape" },
            { id: 2, code: "COZA_LUGBE", name: "COZA Lugbe", city: "Lugbe" }
        ],
        "Lagos": [
            { id: 3, code: "COZA_LAGOS", name: "COZA Lagos", city: "Ikeja" },
            { id: 4, code: "COZA_VI/CHILDREN CHURCH", name: "COZA VI", city: "Maryland" }
        ],
        "Ilorin": [
            { id: 5, code: "COZA_ILORIN", name: "COZA Ilorin", city: "Tanke" }
        ],
        "PH": [
            { id: 6, code: "COZA_PH", name: "COZA PH", city: "Rumuomasi" }
        ]
    },
    "United Kingdom": {
        "Greater London": [
            { id: 7, code: "COZA_LONDON", name: "COZA London", city: "London" }
        ],
        "West Midlands": [
            { id: 8, code: "COZA_BIRMINGHAM", name: "COZA Birmingham", city: "Birmingham" }
        ],
        "Greater Manchester": [
            { id: 9, code: "COZA_MANCHESTER", name: "COZA Manchester", city: "Manchester" }
        ]
    }
};

// Populate country dropdown
function populateCountries() {
    const countrySelect = document.getElementById("country");
    countrySelect.innerHTML = '<option value="">Select Country</option>';

    Object.keys(BRANCHES).forEach(country => {
        const option = document.createElement("option");
        option.value = country;
        option.textContent = country;
        countrySelect.appendChild(option);
    });
}

// Populate state dropdown based on selected country
function populateStates(country) {
    const stateSelect = document.getElementById("state");
    stateSelect.innerHTML = '<option value="">Select State</option>';

    const branchSelect = document.getElementById("branch_id");
    branchSelect.innerHTML = '<option value="">Select Branch</option>';

    if (!country || !BRANCHES[country]) return;

    Object.keys(BRANCHES[country]).forEach(state => {
        const option = document.createElement("option");
        option.value = state;
        option.textContent = state;
        stateSelect.appendChild(option);
    });
}

// Populate branch dropdown based on selected country and state
function populateBranches(country, state) {
    const branchSelect = document.getElementById("branch_id");
    branchSelect.innerHTML = '<option value="">Select Branch</option>';

    if (!country || !state || !BRANCHES[country] || !BRANCHES[country][state]) return;

    BRANCHES[country][state].forEach(branch => {
        const option = document.createElement("option");
        option.value = branch.id;
        option.textContent = `${branch.name} - ${branch.city}`;
        branchSelect.appendChild(option);
    });
}

// Initialize location dropdowns
document.addEventListener("DOMContentLoaded", () => {
    populateCountries();

    // Country change handler
    document.getElementById("country").addEventListener("change", (e) => {
        populateStates(e.target.value);
    });

    // State change handler
    document.getElementById("state").addEventListener("change", (e) => {
        const country = document.getElementById("country").value;
        populateBranches(country, e.target.value);
    });
});
