const cron = require('node-cron');

function keepAliveUrls() {
  const raw =
    process.env.KEEP_ALIVE_URLS ||
    process.env.KEEP_ALIVE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    '';

  return raw
    .split(',')
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean)
    .map((origin) => (origin.endsWith('/health') ? origin : `${origin}/health`));
}

async function pingKeepAlive() {
  const urls = keepAliveUrls();
  if (urls.length === 0) {
    return [];
  }

  const results = [];
  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'user-agent': 'MicroLend-keep-alive' },
      });
      results.push({ url, ok: response.ok, status: response.status });
      console.log(`keep-alive ${response.status} ${url}`);
    } catch (err) {
      results.push({ url, ok: false, error: err.message });
      console.error(`keep-alive failed ${url}:`, err.message);
    }
  }
  return results;
}

function startKeepAlive() {
  const urls = keepAliveUrls();
  if (urls.length === 0) {
    console.log('Keep-alive skipped: set KEEP_ALIVE_URL or KEEP_ALIVE_URLS');
    return;
  }

  // Every 30 minutes — also run once a minute after boot so Render idle does not win first
  cron.schedule('*/30 * * * *', () => {
    pingKeepAlive().catch((err) => console.error('keep-alive job error:', err));
  });

  console.log(`Keep-alive every 30 min: ${urls.join(', ')}`);
}

module.exports = { startKeepAlive, pingKeepAlive, keepAliveUrls };
