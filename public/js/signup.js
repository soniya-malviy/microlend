document.getElementById('signup-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const password = document.getElementById('password').value;
  const button = document.getElementById('submit-btn');

  if (!name || !phone || password.length < 6 || !isValidEmail(email)) {
    showNotification('Fill all fields. Use a valid email and a password of at least 6 characters.', 'error');
    return;
  }

  setButtonLoading(button, true, 'Creating account…');
  try {
    const data = await fetchAPI('/auth/signup', 'POST', { name, email, password, phone });
    setSession(data.token, data.user);
    window.location.href = '/kyc.html';
  } catch (err) {
    showNotification(err.message, 'error');
    setButtonLoading(button, false);
  }
});
