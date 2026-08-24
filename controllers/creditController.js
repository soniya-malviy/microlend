const User = require('../models/User');
const {
  calculateCreditScore,
  riskTier,
  EMPLOYMENT_POINTS,
} = require('../services/calculateCreditScore');

function isNonNegativeNumber(value) {
  const n = typeof value === 'string' && value.trim() !== '' ? Number(value) : Number(value);
  return Number.isFinite(n) && n >= 0;
}

// POST /credit/score
async function score(req, res) {
  try {
    if (req.user.kyc_status !== 'verified') {
      return res.status(403).json({
        error: 'KYC must be verified before requesting a credit score',
        kyc_status: req.user.kyc_status,
      });
    }

    const { monthly_income, existing_debt, employment_type } = req.body || {};
    const employment = typeof employment_type === 'string'
      ? employment_type.trim().toLowerCase()
      : '';

    if (
      !isNonNegativeNumber(monthly_income) ||
      !isNonNegativeNumber(existing_debt) ||
      !Object.prototype.hasOwnProperty.call(EMPLOYMENT_POINTS, employment)
    ) {
      return res.status(400).json({
        error:
          "monthly_income and existing_debt must be >= 0; employment_type must be 'salaried', 'self-employed', or 'unemployed'",
      });
    }

    const income = Number(monthly_income);
    const debt = Number(existing_debt);
    const credit_score = calculateCreditScore(income, debt, employment);
    const approved_limit = credit_score * 50;

    const user = await User.updateCredit(req.user.id, {
      credit_score,
      approved_limit,
    });

    return res.json({
      credit_score,
      approved_limit,
      risk_tier: riskTier(credit_score),
      user: User.toPublicUser(user),
    });
  } catch (err) {
    console.error('credit score error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { score };
