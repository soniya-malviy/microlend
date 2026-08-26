if (!requireAuth()) throw new Error('auth');

renderAppShell('kyc');

function isValidAadhaar(value) {
  const digits = String(value).replace(/\s|-/g, '');
  if (!/^[2-9][0-9]{11}$/.test(digits)) return false;
  const d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  ];
  const p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
  ];
  let c = 0;
  const reversed = digits.split('').reverse();
  for (let i = 0; i < reversed.length; i += 1) {
    c = d[c][p[i % 8][Number(reversed[i])]];
  }
  return c === 0;
}

function isValidPan(value) {
  const pan = String(value).replace(/\s/g, '').toUpperCase();
  return /^[A-Z]{3}P[A-Z][0-9]{4}[A-Z]$/.test(pan);
}

function formatHint(idType) {
  if (idType === 'aadhaar') {
    return '12 digits. First digit 2–9. Spaces allowed.';
  }
  if (idType === 'pan') {
    return '10 characters: 5 letters, 4 digits, 1 letter. 4th letter must be P.';
  }
  return 'Aadhaar: 12 digits. PAN: 10 characters like ABCPE1234F.';
}

const typeSelect = document.getElementById('id_type');
const numberInput = document.getElementById('id_number');
const hint = document.getElementById('id-hint');

function syncIdField() {
  const type = typeSelect.value;
  hint.textContent = formatHint(type);
  if (type === 'aadhaar') {
    numberInput.placeholder = '2345 6789 0124';
    numberInput.maxLength = 14;
    numberInput.style.textTransform = 'none';
  } else if (type === 'pan') {
    numberInput.placeholder = 'ABCPE1234F';
    numberInput.maxLength = 10;
    numberInput.style.textTransform = 'uppercase';
  } else {
    numberInput.placeholder = '';
    numberInput.removeAttribute('maxLength');
    numberInput.style.textTransform = 'none';
  }
}

typeSelect.addEventListener('change', syncIdField);
syncIdField();

async function loadKyc() {
  try {
    const { user } = await fetchAPI('/me');
    document.getElementById('kyc-badge').innerHTML = statusBadge(user.kyc_status);
    const nameInput = document.getElementById('full_name');
    if (user.name && nameInput && !nameInput.value) nameInput.value = user.name;
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

document.getElementById('kyc-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const id_type = document.getElementById('id_type').value;
  const id_number = document.getElementById('id_number').value.trim();
  const full_name = document.getElementById('full_name').value.trim();
  const button = document.getElementById('submit-btn');

  if (!id_type || !id_number || !full_name) {
    showNotification('All KYC fields are required.', 'error');
    return;
  }

  if (id_type === 'aadhaar' && !isValidAadhaar(id_number)) {
    showNotification('Enter a valid 12-digit Aadhaar number.', 'error');
    return;
  }
  if (id_type === 'pan' && !isValidPan(id_number)) {
    showNotification('Enter a valid PAN (e.g. ABCPE1234F). 4th letter must be P.', 'error');
    return;
  }

  setButtonLoading(button, true, 'Verifying…');
  try {
    const data = await fetchAPI('/kyc/verify', 'POST', { id_type, id_number, full_name });
    document.getElementById('kyc-badge').innerHTML = statusBadge(data.kyc_status);
    showNotification(
      data.verified ? 'Identity format verified.' : 'Identity was rejected.',
      data.verified ? 'success' : 'error'
    );
  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    setButtonLoading(button, false);
  }
});

loadKyc();
