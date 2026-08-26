const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function migrate() {
  const raw = fs.readFileSync(path.join(__dirname, 'users.sql'), 'utf8');
  const schema = raw.replace(/CREATE EXTENSION IF NOT EXISTS pgcrypto;\s*/i, '');

  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
  } catch (err) {
    console.warn('pgcrypto extension skipped:', err.message);
  }

  await pool.query(schema);
  console.log('Database schema ready (users, kyc_logs, loans, webhook_logs)');
}

module.exports = { migrate };

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Database schema failed:', err);
      process.exit(1);
    });
}
