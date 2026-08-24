if (!requireAuth()) throw new Error('auth');

renderAppShell('loans');

const params = new URLSearchParams(window.location.search);
const loanId = params.get('id');
const view = document.getElementById('loan-view');

function stepIndex(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'disbursed' || s === 'overdue') return 4;
  if (s === 'failed' || s === 'pending') return 3;
  return 1;
}

function stepperHtml(status) {
  const current = stepIndex(status);
  const failed = String(status).toLowerCase() === 'failed';
  const steps = ['Requested', 'Order created', 'Payment processing', 'Disbursed'];
  return `
    <ol class="mt-8 grid gap-4 sm:grid-cols-4">
      ${steps
        .map((label, index) => {
          const n = index + 1;
          let ring = 'bg-slate-100 text-slate-500';
          if (n <= current && !(failed && n === 3)) ring = 'bg-indigo-600 text-white';
          if (failed && n === 3) ring = 'bg-red-600 text-white';
          if (failed && n === 4) ring = 'bg-slate-100 text-slate-400';
          return `
            <li class="flex items-start gap-3">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${ring}">${n}</span>
              <span class="pt-1 text-sm font-medium text-slate-700">${label}</span>
            </li>`;
        })
        .join('')}
    </ol>
  `;
}

function renderLoan(loan) {
  const canPay =
    loan.status === 'pending' && (loan.order_id || loan.razorpay_order_id) && loan.razorpay_key_id;
  view.innerHTML = `
    <div class="rounded-lg bg-white p-6 shadow-sm">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="font-mono text-xs text-slate-500">${escapeHtml(loan.id)}</p>
          <p class="mt-2 text-3xl font-semibold tracking-tight text-slate-900">${formatINR(loan.amount)}</p>
          <p class="mt-1 text-sm text-slate-500">Due ${formatDate(loan.due_date)}</p>
        </div>
        <div class="text-right">
          ${statusBadge(loan.status)}
          ${
            canPay
              ? '<button id="pay-btn" type="button" class="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700">Pay now</button>'
              : ''
          }
        </div>
      </div>
      ${stepperHtml(loan.status)}
    </div>
  `;
  const payBtn = document.getElementById('pay-btn');
  if (payBtn) payBtn.addEventListener('click', () => openCheckout(loan));
}

function openCheckout(loan) {
  if (typeof Razorpay === 'undefined') {
    showNotification('Razorpay Checkout failed to load.', 'error');
    return;
  }
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const rzp = new Razorpay({
    key: loan.razorpay_key_id,
    amount: Math.round(Number(loan.amount) * 100),
    currency: 'INR',
    name: 'MicroLend',
    description: 'Loan disbursement',
    order_id: loan.order_id || loan.razorpay_order_id,
    prefill: {
      name: user.name || '',
      email: user.email || '',
      contact: user.phone || '',
    },
    theme: { color: '#4F46E5' },
    handler() {
      showNotification('Payment submitted. Status updates when Razorpay confirms.', 'success');
      setTimeout(() => window.location.reload(), 1500);
    },
  });
  rzp.on('payment.failed', () => showNotification('Payment failed.', 'error'));
  rzp.open();
}

if (!loanId) {
  view.innerHTML = '<p class="text-sm text-slate-500">Missing loan id.</p>';
} else {
  fetchAPI(`/loans/${loanId}`)
    .then(({ loan }) => renderLoan(loan))
    .catch((err) => {
      view.innerHTML = `<p class="text-sm text-red-600">${escapeHtml(err.message)}</p>`;
    });
}
