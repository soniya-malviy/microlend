const { query } = require('../db');

async function create({
  source = 'razorpay',
  event,
  razorpay_event_id,
  razorpay_order_id,
  signature_valid,
  payload,
}) {
  const { rows } = await query(
    `INSERT INTO webhook_logs
       (source, event, razorpay_event_id, razorpay_order_id, signature_valid, payload)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)
     RETURNING id, source, event, razorpay_event_id, razorpay_order_id, signature_valid, payload, created_at`,
    [
      source,
      event || null,
      razorpay_event_id || null,
      razorpay_order_id || null,
      signature_valid,
      JSON.stringify(payload),
    ]
  );
  return rows[0];
}

module.exports = { create };
