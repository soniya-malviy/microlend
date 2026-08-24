if (!requireAuth()) throw new Error('auth');

renderAppShell('kyc');

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

  setButtonLoading(button, true, 'Verifying…');
  try {
    const data = await fetchAPI('/kyc/verify', 'POST', { id_type, id_number, full_name });
    document.getElementById('kyc-badge').innerHTML = statusBadge(data.kyc_status);
    showNotification(
      data.verified ? 'Identity verified.' : 'Identity was rejected.',
      data.verified ? 'success' : 'error'
    );
  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    setButtonLoading(button, false);
  }
});

loadKyc();
