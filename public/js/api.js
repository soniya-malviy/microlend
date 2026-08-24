function getToken() {
  return localStorage.getItem('token');
}

function setSession(token, user) {
  if (token) localStorage.setItem('token', token);
  if (user) localStorage.setItem('user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

async function fetchAPI(endpoint, method = 'GET', body = null) {
  const headers = { Accept: 'application/json' };
  if (body !== null && body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body !== null && body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = {};
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !endpoint.startsWith('/auth/')) {
      clearSession();
      window.location.href = '/login.html';
    }
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
