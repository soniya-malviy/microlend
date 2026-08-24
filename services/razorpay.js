const Razorpay = require('razorpay');

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

// Razorpay expects amount in paise (INR × 100). Test-mode keys (rzp_test_*) are used from .env.
async function createOrder({ amount, receipt, notes }) {
  if (!keyId || !keySecret) {
    const err = new Error('Razorpay is not configured');
    err.code = 'RAZORPAY_NOT_CONFIGURED';
    throw err;
  }

  return razorpay.orders.create({
    amount: Math.round(Number(amount) * 100),
    currency: 'INR',
    receipt: String(receipt).slice(0, 40),
    notes: notes || {},
  });
}

function getPublicKeyId() {
  return keyId;
}

module.exports = { createOrder, getPublicKeyId };
