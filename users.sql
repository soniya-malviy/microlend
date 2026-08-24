-- MicroLend users table
-- Apply with: psql "$DATABASE_URL" -f users.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  kyc_status VARCHAR(32) NOT NULL DEFAULT 'pending',
  credit_score INTEGER DEFAULT NULL,
  approved_limit INTEGER DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- One row per KYC verification attempt (audit trail)
CREATE TABLE IF NOT EXISTS kyc_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  id_type VARCHAR(64) NOT NULL,
  id_number VARCHAR(128) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  verified BOOLEAN NOT NULL,
  kyc_status VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kyc_logs_user_id ON kyc_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_logs_created_at ON kyc_logs (created_at);

-- Existing databases created before approved_limit existed
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_limit INTEGER DEFAULT NULL;

-- One row per loan disbursement attempt
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  razorpay_order_id VARCHAR(128),
  disbursed_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans (user_id);
CREATE INDEX IF NOT EXISTS idx_loans_razorpay_order_id ON loans (razorpay_order_id);

-- Raw Razorpay (and future) webhook events for audit/debug
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(32) NOT NULL DEFAULT 'razorpay',
  event VARCHAR(128),
  razorpay_event_id VARCHAR(128),
  razorpay_order_id VARCHAR(128),
  signature_valid BOOLEAN NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event ON webhook_logs (event);
