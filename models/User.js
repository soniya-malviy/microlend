const { query } = require('../db');

const USER_COLUMNS = `
  id, name, email, password_hash, phone, kyc_status, credit_score, approved_limit, created_at
`;

// Shape returned to clients — never include password_hash
function toPublicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    kyc_status: row.kyc_status,
    credit_score: row.credit_score,
    approved_limit: row.approved_limit,
    created_at: row.created_at,
  };
}

async function create({ name, email, password_hash, phone }) {
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash, phone)
     VALUES ($1, $2, $3, $4)
     RETURNING ${USER_COLUMNS}`,
    [name, email, password_hash, phone]
  );
  return rows[0];
}

async function findByEmail(email) {
  const { rows } = await query(
    `SELECT ${USER_COLUMNS} FROM users WHERE email = $1 LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await query(
    `SELECT ${USER_COLUMNS} FROM users WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function updateKycStatus(id, kyc_status, client = null) {
  const run = client ? client.query.bind(client) : query;
  const { rows } = await run(
    `UPDATE users SET kyc_status = $2 WHERE id = $1
     RETURNING ${USER_COLUMNS}`,
    [id, kyc_status]
  );
  return rows[0] || null;
}

async function updateCredit(id, { credit_score, approved_limit }) {
  const { rows } = await query(
    `UPDATE users SET credit_score = $2, approved_limit = $3 WHERE id = $1
     RETURNING ${USER_COLUMNS}`,
    [id, credit_score, approved_limit]
  );
  return rows[0] || null;
}

async function resetSandbox(id, { name, phone, password_hash }) {
  await query('DELETE FROM loans WHERE user_id = $1', [id]);
  await query('DELETE FROM kyc_logs WHERE user_id = $1', [id]);
  const { rows } = await query(
    `UPDATE users
     SET name = $2,
         phone = $3,
         password_hash = $4,
         kyc_status = 'pending',
         credit_score = NULL,
         approved_limit = NULL
     WHERE id = $1
     RETURNING ${USER_COLUMNS}`,
    [id, name, phone, password_hash]
  );
  return rows[0] || null;
}

module.exports = {
  create,
  findByEmail,
  findById,
  updateKycStatus,
  updateCredit,
  resetSandbox,
  toPublicUser,
};
