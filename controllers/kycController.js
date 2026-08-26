const { pool } = require('../db');
const User = require('../models/User');
const KycLog = require('../models/KycLog');
const { verifyIdentity } = require('../services/verifyIdentity');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

// POST /kyc/verify
async function verify(req, res) {
  const { id_type, id_number, full_name } = req.body || {};

  if (
    !isNonEmptyString(id_type) ||
    !isNonEmptyString(id_number) ||
    !isNonEmptyString(full_name)
  ) {
    return res.status(400).json({
      error: 'id_type, id_number, and full_name are required',
    });
  }

  const check = verifyIdentity(id_type.trim(), id_number.trim());
  if (!check.ok) {
    return res.status(400).json({ error: check.error || 'Invalid ID format' });
  }

  const verified = check.verified;
  const kyc_status = verified ? 'verified' : 'rejected';
  const storedType = check.id_type || id_type.trim().toLowerCase();
  const storedNumber = check.id_number || id_number.trim();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const user = await User.updateKycStatus(req.user.id, kyc_status, client);
    const log = await KycLog.create(
      {
        user_id: req.user.id,
        id_type: storedType,
        id_number: storedNumber,
        full_name: full_name.trim(),
        verified,
        kyc_status,
      },
      client
    );
    await client.query('COMMIT');

    return res.json({
      verified,
      kyc_status: user.kyc_status,
      user: User.toPublicUser(user),
      attempt_id: log.id,
      attempted_at: log.created_at,
    });
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback errors
    }
    console.error('kyc verify error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
}

module.exports = { verify };
