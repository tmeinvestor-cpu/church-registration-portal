async function loadCountries() {
  const res = await fetch('/api/countries');
  const countries = await res.json();

  const select = document.getElementById('country');
  select.innerHTML = '<option value="">Select country</option>';

  countries.forEach(c => {
    select.innerHTML += `<option value="${c}">${c}</option>`;
  });
}

async function loadStates() {
  const country = document.getElementById('country').value;
  const res = await fetch(`/api/states?country=${country}`);
  const states = await res.json();

  const select = document.getElementById('state');
  select.innerHTML = '<option value="">Select state</option>';

  states.forEach(s => {
    select.innerHTML += `<option value="${s}">${s}</option>`;
  });
}


async function loadBranches() {
  const country = document.getElementById('country').value;
  const state = document.getElementById('state').value;

  const res = await fetch(`/api/branches?country=${country}&state=${state}`);
  const branches = await res.json();

  const select = document.getElementById('branch');
  select.innerHTML = '<option value="">Select branch</option>';

  branches.forEach(b => {
    select.innerHTML += `<option value="${b.id}">${b.name}</option>`;
  });
}


window.onload = loadCountries;
