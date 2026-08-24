const { Pool } = require('pg');
require('dotenv').config();

// Shared PostgreSQL pool. DATABASE_URL comes from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
