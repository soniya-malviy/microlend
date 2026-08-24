const { pool } = require('../db');
const Loan = require('../models/Loan');
const razorpay = require('../services/razorpay');

function isPositiveAmount(value) {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : Number(value);
  return Number.isFinite(n) && n > 0;
}

// POST /loans/disburse
async function disburse(req, res) {
  const user = req.user;

  if (user.kyc_status !== 'verified') {
    return res.status(403).json({
      error: 'KYC must be verified before disbursing a loan',
      kyc_status: user.kyc_status,
    });
  }

  if (user.credit_score == null || user.approved_limit == null) {
    return res.status(403).json({
      error: 'Credit score must be generated before disbursing a loan',
    });
  }

  const { amount } = req.body || {};
  if (!isPositiveAmount(amount)) {
    return res.status(400).json({ error: 'amount must be a number greater than 0' });
  }

  const loanAmount = Math.round(Number(amount));
  if (loanAmount > user.approved_limit) {
    return res.status(400).json({
      error: 'amount exceeds approved_limit',
      approved_limit: user.approved_limit,
    });
  }

  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const loan = await Loan.create(
      { user_id: user.id, amount: loanAmount, due_date: dueDate },
      client
    );

    const order = await razorpay.createOrder({
      amount: loanAmount,
      receipt: loan.id,
      notes: { loan_id: loan.id, user_id: user.id },
    });

    const saved = await Loan.setRazorpayOrderId(loan.id, order.id, client);
    await client.query('COMMIT');

    return res.status(201).json({
      loan: Loan.toPublicLoan(saved),
      order_id: order.id,
      razorpay_key_id: razorpay.getPublicKeyId(),
      amount: loanAmount,
      currency: 'INR',
    });
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback errors
    }
    console.error('loan disburse error:', err);
    if (err.code === 'RAZORPAY_NOT_CONFIGURED') {
      return res.status(500).json({ error: 'Razorpay is not configured' });
    }
    return res.status(500).json({ error: 'Failed to create loan disbursement order' });
  } finally {
    client.release();
  }
}

function withCheckoutFields(loan) {
  return {
    ...Loan.toPublicLoan(loan),
    razorpay_key_id: razorpay.getPublicKeyId(),
    order_id: loan.razorpay_order_id,
  };
}

// GET /loans
async function list(req, res) {
  try {
    const loans = await Loan.findByUserId(req.user.id);
    return res.json({ loans: loans.map(withCheckoutFields) });
  } catch (err) {
    console.error('loan list error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /loans/:id
async function getById(req, res) {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan || loan.user_id !== req.user.id) {
      return res.status(404).json({ error: 'Loan not found' });
    }
    return res.json({ loan: withCheckoutFields(loan) });
  } catch (err) {
    console.error('loan get error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { disburse, list, getById };
