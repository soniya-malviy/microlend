if (!requireAuth()) throw new Error('auth');

renderAppShell('dashboard');

const modal = document.getElementById('loan-modal');
const requestBtn = document.getElementById('request-loan-btn');
let currentUser = null;

function openModal() {
  modal.classList.remove('hidden');
}

function closeModal() {
  modal.classList.add('hidden');
}

document.querySelectorAll('#loan-modal [data-close-modal]').forEach((el) => {
  el.addEventListener('click', closeModal);
});

async function loadDashboard() {
  try {
    const [{ user }, { loans }] = await Promise.all([
      fetchAPI('/me'),
      fetchAPI('/loans'),
    ]);
    currentUser = user;
    document.getElementById('kyc-value').innerHTML = statusBadge(user.kyc_status);
    document.getElementById('score-value').textContent =
      user.credit_score != null ? user.credit_score : '—';
    document.getElementById('limit-value').textContent = formatINR(user.approved_limit);
    document.getElementById('loans-body').innerHTML = loanRowsHtml(loans);

    requestBtn.disabled = !(
      user.kyc_status === 'verified' &&
      user.credit_score != null &&
      user.approved_limit != null
    );
  } catch (err) {
    showNotification(err.message, 'error');
  }
}

requestBtn.addEventListener('click', () => {
  if (requestBtn.disabled) {
    showNotification('Verify KYC and generate a credit score first.', 'error');
    return;
  }
  openModal();
});

document.getElementById('loan-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const amount = Number(document.getElementById('amount').value);
  const button = document.getElementById('loan-submit');
  if (!amount || amount <= 0) {
    showNotification('Enter a valid amount.', 'error');
    return;
  }
  if (currentUser && amount > currentUser.approved_limit) {
    showNotification(`Amount exceeds approved limit of ${formatINR(currentUser.approved_limit)}.`, 'error');
    return;
  }

  setButtonLoading(button, true, 'Creating order…');
  try {
    const data = await fetchAPI('/loans/disburse', 'POST', { amount });
    showNotification('Loan order created. Complete payment to disburse.', 'success');
    closeModal();
    window.location.href = `/loan-detail.html?id=${encodeURIComponent(data.loan.id)}`;
  } catch (err) {
    showNotification(err.message, 'error');
    setButtonLoading(button, false);
  }
});

loadDashboard();
