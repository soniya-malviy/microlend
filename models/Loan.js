const { query } = require('../db');

const LOAN_COLUMNS = `
  id, user_id, amount, status, razorpay_order_id, disbursed_at, due_date, created_at
`;

function toPublicLoan(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    amount: row.amount,
    status: row.status,
    razorpay_order_id: row.razorpay_order_id,
    disbursed_at: row.disbursed_at,
    due_date: row.due_date,
    created_at: row.created_at,
  };
}

async function create({ user_id, amount, due_date }, client = null) {
  const run = client ? client.query.bind(client) : query;
  const { rows } = await run(
    `INSERT INTO loans (user_id, amount, status, due_date)
     VALUES ($1, $2, 'pending', $3)
     RETURNING ${LOAN_COLUMNS}`,
    [user_id, amount, due_date]
  );
  return rows[0];
}

async function setRazorpayOrderId(id, razorpay_order_id, client = null) {
  const run = client ? client.query.bind(client) : query;
  const { rows } = await run(
    `UPDATE loans SET razorpay_order_id = $2 WHERE id = $1
     RETURNING ${LOAN_COLUMNS}`,
    [id, razorpay_order_id]
  );
  return rows[0] || null;
}

async function findByRazorpayOrderId(razorpay_order_id) {
  const { rows } = await query(
    `SELECT ${LOAN_COLUMNS} FROM loans WHERE razorpay_order_id = $1 LIMIT 1`,
    [razorpay_order_id]
  );
  return rows[0] || null;
}

async function markDisbursed(id) {
  const { rows } = await query(
    `UPDATE loans
     SET status = 'disbursed', disbursed_at = NOW()
     WHERE id = $1
     RETURNING ${LOAN_COLUMNS}`,
    [id]
  );
  return rows[0] || null;
}

async function markFailed(id) {
  const { rows } = await query(
    `UPDATE loans
     SET status = 'failed'
     WHERE id = $1
     RETURNING ${LOAN_COLUMNS}`,
    [id]
  );
  return rows[0] || null;
}

async function findDisbursedDueWithinDays(days) {
  const { rows } = await query(
    `SELECT
       l.id, l.user_id, l.amount, l.status, l.razorpay_order_id,
       l.disbursed_at, l.due_date, l.created_at,
       u.phone AS user_phone, u.name AS user_name, u.email AS user_email
     FROM loans l
     JOIN users u ON u.id = l.user_id
     WHERE l.status = 'disbursed'
       AND l.due_date >= NOW()
       AND l.due_date <= NOW() + ($1 || ' days')::INTERVAL
     ORDER BY l.due_date ASC`,
    [days]
  );
  return rows;
}

async function findById(id) {
  const { rows } = await query(
    `SELECT ${LOAN_COLUMNS} FROM loans WHERE id = $1 LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function findByUserId(user_id) {
  const { rows } = await query(
    `SELECT ${LOAN_COLUMNS} FROM loans WHERE user_id = $1 ORDER BY created_at DESC`,
    [user_id]
  );
  return rows;
}

async function markOverdue() {
  const { rows } = await query(
    `UPDATE loans
     SET status = 'overdue'
     WHERE status = 'disbursed'
       AND due_date < NOW()
     RETURNING ${LOAN_COLUMNS}`
  );
  return rows;
}

module.exports = {
  create,
  setRazorpayOrderId,
  findByRazorpayOrderId,
  findById,
  findByUserId,
  markDisbursed,
  markFailed,
  findDisbursedDueWithinDays,
  markOverdue,
  toPublicLoan,
};
