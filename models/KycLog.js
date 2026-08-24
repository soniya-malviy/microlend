const { query } = require('../db');

async function create(
  { user_id, id_type, id_number, full_name, verified, kyc_status },
  client = null
) {
  const run = client ? client.query.bind(client) : query;
  const { rows } = await run(
    `INSERT INTO kyc_logs
       (user_id, id_type, id_number, full_name, verified, kyc_status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, id_type, id_number, full_name, verified, kyc_status, created_at`,
    [user_id, id_type, id_number, full_name, verified, kyc_status]
  );
  return rows[0];
}

module.exports = { create };
