const { Pool } = require('pg');
require('dotenv').config();

// Shared PostgreSQL pool. DATABASE_URL comes from .env
const isLocal =
  /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL || '');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
