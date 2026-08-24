const EMPLOYMENT_POINTS = {
  salaried: 50,
  'self-employed': 20,
  unemployed: 0,
};

function calculateCreditScore(income, debt, employment_type) {
  const incomePoints = Math.min(400, Math.floor(Number(income) / 1000) * 2);
  const debtPoints = Math.floor(Number(debt) / 1000) * 3;
  const employmentPoints = EMPLOYMENT_POINTS[employment_type] ?? 0;

  const raw = 300 + incomePoints - debtPoints + employmentPoints;
  return Math.min(900, Math.max(300, raw));
}

function riskTier(score) {
  if (score > 750) return 'low risk';
  if (score >= 500) return 'medium risk';
  return 'high risk';
}

module.exports = { calculateCreditScore, riskTier, EMPLOYMENT_POINTS };
