function showNotification(message, type = 'success') {
  let root = document.getElementById('toasts');
  if (!root) {
    root = document.createElement('div');
    root.id = 'toasts';
    root.className = 'fixed top-4 right-4 z-[80] space-y-2 w-[min(100%-2rem,24rem)]';
    document.body.appendChild(root);
  }

  const ring = {
    success: 'ring-emerald-200',
    error: 'ring-red-200',
    info: 'ring-indigo-200',
  };
  const dot = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-indigo-600',
  };

  const el = document.createElement('div');
  el.className = `toast-enter toast-enter flex items-start gap-3 rounded-lg bg-white px-4 py-3 shadow-md ring-1 ${ring[type] || ring.info}`;
  el.innerHTML = `
    <span class="mt-1 h-2 w-2 shrink-0 rounded-full ${dot[type] || dot.info}"></span>
    <p class="text-sm leading-5 text-slate-800">${escapeHtml(message)}</p>
  `;
  root.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 200ms';
    setTimeout(() => el.remove(), 200);
  }, 3000);
}

function statusBadge(status) {
  const value = String(status || 'pending').toLowerCase();
  let color = 'bg-amber-50 text-amber-700 ring-amber-200';
  if (['verified', 'disbursed', 'success', 'captured'].includes(value)) {
    color = 'bg-emerald-50 text-green-700 ring-emerald-200';
  } else if (['rejected', 'failed', 'overdue'].includes(value)) {
    color = 'bg-red-50 text-red-700 ring-red-200';
  }
  return `<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${color}">${escapeHtml(value.replace(/_/g, ' '))}</span>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatINR(amount) {
  if (amount == null || amount === '') return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function requireAuth() {
  if (!getToken()) {
    window.location.replace('/login.html');
    return false;
  }
  return true;
}

function logout() {
  clearSession();
  window.location.href = '/login.html';
}

function setButtonLoading(button, loading, waitingText = 'Please wait…') {
  if (!button) return;
  if (loading) {
    button.dataset.label = button.innerHTML;
    button.disabled = true;
    button.classList.add('inline-flex', 'items-center', 'justify-center');
    button.innerHTML = `
      <svg class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>${waitingText}`;
  } else {
    button.disabled = false;
    button.innerHTML = button.dataset.label || button.innerHTML;
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
}

function navItem(href, label, key, active) {
  const on = active === key;
  return `<a href="${href}" class="flex items-center rounded-lg px-3 py-2 text-sm font-medium ${
    on ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  }">${label}</a>`;
}

function renderAppShell(active) {
  const shell = document.getElementById('app');
  const page = document.getElementById('page-content');
  const existing = page ? page.innerHTML : shell.innerHTML;

  shell.innerHTML = `
    <div class="min-h-screen bg-slate-50">
      <div id="sidebar-overlay" class="fixed inset-0 z-30 bg-slate-900/40 md:hidden"></div>
      <aside id="sidebar" class="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200/80 bg-white shadow-sm transition-transform duration-200 md:translate-x-0">
        <div class="flex h-16 items-center gap-2.5 px-5">
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white">M</span>
          <span class="text-base font-semibold tracking-tight text-slate-900">MicroLend</span>
        </div>
        <nav class="flex-1 space-y-1 px-3 py-4">
          ${navItem('/dashboard.html', 'Dashboard', 'dashboard', active)}
          ${navItem('/loans.html', 'Loans', 'loans', active)}
          ${navItem('/kyc.html', 'KYC', 'kyc', active)}
          ${navItem('/credit-score.html', 'Credit score', 'credit', active)}
          ${navItem('/profile.html', 'Profile', 'profile', active)}
        </nav>
        <div class="border-t border-slate-100 p-3">
          <button id="logout-btn" type="button" class="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-50">Log out</button>
        </div>
      </aside>
      <div class="md:pl-64">
        <header class="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur md:px-8">
          <button id="menu-btn" type="button" class="rounded-lg p-2 text-slate-600 hover:bg-slate-50 md:hidden" aria-label="Open menu">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <p class="text-sm font-medium text-slate-500">MicroLend</p>
          <button id="logout-btn-top" type="button" class="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Log out</button>
        </header>
        <main id="page-content" class="px-4 py-8 md:px-8">${existing}</main>
      </div>
    </div>
  `;

  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  document.getElementById('menu-btn').addEventListener('click', () => {
    sidebar.classList.add('open');
    overlay.classList.add('open');
  });
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });
  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('logout-btn-top').addEventListener('click', logout);
}

function loanRowsHtml(loans) {
  if (!loans || loans.length === 0) {
    return '<tr><td colspan="5" class="px-4 py-10 text-center text-sm text-slate-500">No loans yet.</td></tr>';
  }
  return loans
    .map(
      (loan) => `
      <tr class="hover:bg-slate-50/80">
        <td class="whitespace-nowrap px-4 py-3 font-mono text-xs text-slate-500">${escapeHtml(String(loan.id).slice(0, 8))}…</td>
        <td class="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-800">${formatINR(loan.amount)}</td>
        <td class="whitespace-nowrap px-4 py-3">${statusBadge(loan.status)}</td>
        <td class="whitespace-nowrap px-4 py-3 text-sm text-slate-600">${formatDate(loan.due_date)}</td>
        <td class="whitespace-nowrap px-4 py-3 text-right">
          <a class="text-sm font-medium text-indigo-600 hover:text-indigo-700" href="/loan-detail.html?id=${encodeURIComponent(loan.id)}">View</a>
        </td>
      </tr>`
    )
    .join('');
}

function scoreColor(score) {
  if (score > 750) return { text: 'text-green-600', ring: '#16a34a' };
  if (score >= 500) return { text: 'text-amber-500', ring: '#f59e0b' };
  return { text: 'text-red-600', ring: '#dc2626' };
}

function renderScoreGauge(score) {
  const s = Number(score) || 0;
  const c = 2 * Math.PI * 52;
  const pct = Math.min(1, Math.max(0, (s - 300) / 600));
  const offset = c * (1 - pct);
  const colors = scoreColor(s);
  return `
    <div class="relative mx-auto h-44 w-44">
      <svg viewBox="0 0 120 120" class="h-full w-full">
        <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" stroke-width="10"></circle>
        <circle class="gauge-ring" cx="60" cy="60" r="52" fill="none" stroke="${colors.ring}" stroke-width="10"
          stroke-linecap="round" stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}"></circle>
      </svg>
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <p class="text-4xl font-semibold tracking-tight ${colors.text}">${s}</p>
        <p class="text-xs text-slate-500">Credit score</p>
      </div>
    </div>
  `;
}
