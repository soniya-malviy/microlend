// API origin. Same-host (including ngrok) uses the current origin.
const API_BASE_URL = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://localhost:3000'
  : window.location.origin;
