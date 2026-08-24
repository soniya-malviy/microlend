if (!requireAuth()) throw new Error('auth');

renderAppShell('credit');

function showScore(data) {
  document.getElementById('score-result').innerHTML = `
    ${renderScoreGauge(data.credit_score)}
    <p class="mt-6 text-sm text-slate-500">Approved limit</p>
    <p class="text-xl font-semibold text-slate-900">${formatINR(data.approved_limit)}</p>
    <p class="mt-4">${statusBadge(data.risk_tier)}</p>
  `;
}

async function loadExisting() {
  try {
    const { user } = await fetchAPI('/me');
    if (user.credit_score != null) {
      const score = Number(user.credit_score);
      showScore({
        credit_score: score,
        approved_limit: user.approved_limit,
        risk_tier: score > 750 ? 'low risk' : score >= 500 ? 'medium risk' : 'high risk',
      });
    }
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

document.getElementById('score-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const monthly_income = document.getElementById('monthly_income').value;
  const existing_debt = document.getElementById('existing_debt').value;
  const employment_type = document.getElementById('employment_type').value;
  const button = document.getElementById('submit-btn');

  if (monthly_income === '' || existing_debt === '' || !employment_type) {
    showNotification('Income, debt, and employment type are required.', 'error');
    return;
  }

  setButtonLoading(button, true, 'Scoring…');
  try {
    const data = await fetchAPI('/credit/score', 'POST', {
      monthly_income: Number(monthly_income),
      existing_debt: Number(existing_debt),
      employment_type,
    });
    showScore(data);
    showNotification('Credit score updated.', 'success');
  } catch (err) {
    showNotification(err.message, 'error');
  } finally {
    setButtonLoading(button, false);
  }
});

loadExisting();
