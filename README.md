# MicroLend

A backend micro-lending platform that simulates the core workflow of a real fintech lending product — from user onboarding and identity verification through credit scoring, loan disbursement, and repayment tracking.

I built this to get hands-on with the kind of systems fintech companies actually run in production: KYC pipelines, rule-based underwriting, and payment gateway integrations with signature-verified webhooks — rather than another CRUD app.

---

## What it does

1. A user signs up and logs in (JWT-based auth).
2. They submit ID details for KYC verification.
3. Once verified, they submit income/employment info and get a credit score and an approved loan limit.
4. They can request a loan up to that limit — the backend creates a Razorpay order and disburses via a real payment gateway flow.
5. Razorpay confirms payment success/failure through a signature-verified webhook, which updates the loan status in the database.
6. A scheduled job checks for loans nearing their due date and logs/sends repayment reminders.

---

## Tech Stack

**Backend:** Node.js, Express.js, PostgreSQL
**Auth:** JWT, bcrypt
**Payments:** Razorpay API, webhooks with HMAC-SHA256 signature verification
**Scheduled jobs:** node-cron
**Frontend:** Vanilla JavaScript, Tailwind CSS
**Infra:** Render (backend), Netlify (frontend), Neon (managed PostgreSQL), ngrok (local webhook testing during development)

---

## Architecture

```
Client (Browser)
      |
      v
Express API  ------>  PostgreSQL (users, loans, transactions, webhook_logs)
      |
      |---> KYC verification (mock identity check + audit log)
      |---> Credit scoring engine (rule-based)
      |---> Razorpay (order creation + disbursement)
      |---> Webhook listener (signature-verified status updates)
      |---> Cron job (repayment reminders, overdue checks)
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Create a new user account |
| POST | `/auth/login` | Authenticate and receive a JWT |
| POST | `/kyc/verify` | Submit ID details for identity verification |
| POST | `/credit/score` | Get a credit score and approved loan limit |
| POST | `/loans/disburse` | Request a loan and create a Razorpay order |
| GET | `/loans` | List a user's loan history |
| POST | `/webhooks/razorpay` | Razorpay's server-to-server payment status callback |

All routes except `/auth/*` and `/webhooks/razorpay` require a `Bearer <token>` header.

---

## Why these design choices

**Rule-based credit scoring, not ML.** Lending decisions need to be explainable and auditable — a score you can't justify to a regulator or a customer isn't usable in production, regardless of how accurate it is.

**Webhooks over polling for payment status.** The frontend can't be trusted as the source of truth for whether a payment actually succeeded — a user could close the tab mid-transaction. Razorpay's webhook is the authoritative signal, and I verify its HMAC signature so a forged request can't fake a "payment successful" event.

**KYC gates credit scoring, which gates loan disbursement.** This mirrors how real underwriting works — you can't assess risk for someone whose identity you haven't confirmed.

---

## Running it locally

```bash
git clone <your-repo-url>
cd microlend
npm install
```

Create a `.env` file:

```
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx
```

Run the schema against your database, then:

```bash
npm run dev
```

For local webhook testing, expose your server with ngrok and register the tunnel URL in Razorpay's Dashboard under Webhooks:

```bash
ngrok http 3000
```

---

## What I'd add next

- Idempotent webhook handling (Razorpay can retry-deliver the same event)
- Swap the mock KYC check for a real identity verification provider
- Replace node-cron with a proper job queue (BullMQ) for retry-safe reminders
- Rate limiting and request logging middleware
- Real SMS reminders via Twilio instead of console-logged mocks

---

## Live Demo

https://microlend-jmi9.onrender.com/

*(Note: the free-tier backend may take ~30-50 seconds to wake up on first request.)*
