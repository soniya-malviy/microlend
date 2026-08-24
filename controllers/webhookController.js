const crypto = require('crypto');
const Loan = require('../models/Loan');
const WebhookLog = require('../models/WebhookLog');

function verifyRazorpaySignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !signature) return false;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const received = Buffer.from(String(signature));
  const computed = Buffer.from(expected);
  if (received.length !== computed.length) return false;
  return crypto.timingSafeEqual(received, computed);
}

function extractPaymentEntity(payload) {
  return payload?.payload?.payment?.entity || null;
}

// POST /webhooks/razorpay — called by Razorpay (no JWT)
async function razorpay(req, res) {
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));

  const signature = req.headers['x-razorpay-signature'];
  const signatureValid = verifyRazorpaySignature(rawBody, signature);

  let eventPayload;
  try {
    eventPayload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    await WebhookLog.create({
      event: null,
      signature_valid: signatureValid,
      payload: { raw: rawBody.toString('utf8') },
    });
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  const payment = extractPaymentEntity(eventPayload);
  const orderId = payment?.order_id || null;

  await WebhookLog.create({
    event: eventPayload.event || null,
    razorpay_event_id: eventPayload.id || null,
    razorpay_order_id: orderId,
    signature_valid: signatureValid,
    payload: eventPayload,
  });

  if (!signatureValid) {
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const eventName = eventPayload.event;
  if (eventName !== 'payment.captured' && eventName !== 'payment.failed') {
    return res.json({ received: true, event: eventName });
  }

  if (!orderId) {
    return res.status(400).json({ error: 'Missing payment order_id' });
  }

  const loan = await Loan.findByRazorpayOrderId(orderId);
  if (!loan) {
    return res.status(404).json({ error: 'Loan not found for order_id', order_id: orderId });
  }

  const updated =
    eventName === 'payment.captured'
      ? await Loan.markDisbursed(loan.id)
      : await Loan.markFailed(loan.id);

  return res.json({
    received: true,
    event: eventName,
    loan: Loan.toPublicLoan(updated),
  });
}

module.exports = { razorpay };
