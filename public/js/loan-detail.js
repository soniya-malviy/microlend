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
  const steps = ['Requested', 'Order created', 'Checkout', 'Disbursed'];
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
            <li class="relative flex items-start gap-3">
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${ring}">${n}</span>
              <span class="pt-1.5 text-sm font-medium text-slate-700">${label}</span>
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
    <div class="grid gap-6 lg:grid-cols-5">
      <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 lg:col-span-3">
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Loan ledger</p>
        <p class="mt-2 font-mono text-xs text-slate-500">${escapeHtml(loan.id)}</p>
        <p class="mt-4 text-4xl font-semibold tracking-tight text-slate-900">${formatINR(loan.amount)}</p>
        <p class="mt-1 text-sm text-slate-500">Due ${formatDate(loan.due_date)} · Currency INR</p>
        <div class="mt-4">${statusBadge(loan.status)}</div>
        ${stepperHtml(loan.status)}
      </div>
      <aside class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 lg:col-span-2">
        <div class="pay-card-art h-44"></div>
        <div class="p-6">
          <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Razorpay checkout</p>
          <p class="mt-2 text-sm text-slate-600">Complete payment on Razorpay’s PCI-hosted modal. Cards, UPI, and netbanking are enabled in test mode.</p>
          <div class="mt-4">${paymentRailHtml()}</div>
          <p class="mt-4 font-mono text-[11px] text-slate-400">order ${escapeHtml(loan.order_id || loan.razorpay_order_id || '—')}</p>
          ${
            canPay
              ? '<button id="pay-btn" type="button" class="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">Pay securely</button>'
              : '<p class="mt-5 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">Checkout is available while the loan is pending capture.</p>'
          }
          <p class="mt-3 text-[11px] leading-4 text-slate-400">We never see PAN / CVV. Signature verified with HMAC on webhook.</p>
        </div>
      </aside>
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
    description: 'Loan disbursement · INR',
    image: '/images/logo-mark.png',
    order_id: loan.order_id || loan.razorpay_order_id,
    prefill: {
      name: user.name || '',
      email: user.email || '',
      contact: user.phone || '',
    },
    notes: { loan_id: loan.id },
    theme: { color: '#4F46E5' },
    handler() {
      showNotification('Payment submitted. Status updates when Razorpay confirms.', 'success');
      setTimeout(() => window.location.reload(), 1500);
    },
  });
  rzp.on('payment.failed', () => showNotification('Payment failed. Try another method or test card.', 'error'));
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
