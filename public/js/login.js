document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const button = document.getElementById('submit-btn');

  if (!isValidEmail(email) || !password) {
    showNotification('Enter a valid email and password.', 'error');
    return;
  }

  setButtonLoading(button, true, 'Signing in…');
  try {
    const data = await fetchAPI('/auth/login', 'POST', { email, password });
    setSession(data.token, data.user);
    window.location.href = '/dashboard.html';
  } catch (err) {
    showNotification(err.message, 'error');
    setButtonLoading(button, false);
  }
});

document.getElementById('demo-btn').addEventListener('click', async () => {
  const button = document.getElementById('demo-btn');
  setButtonLoading(button, true, 'Opening demo…');
  try {
    const data = await fetchAPI('/auth/demo', 'POST', {});
    setSession(data.token, data.user);
    window.location.href = '/dashboard.html';
  } catch (err) {
    showNotification(err.message, 'error');
    setButtonLoading(button, false);
  }
});
