if (!requireAuth()) throw new Error('auth');

renderAppShell('profile');

fetchAPI('/me')
  .then(({ user }) => {
    document.getElementById('profile-card').innerHTML = `
      <dl class="space-y-4 text-sm">
        <div>
          <dt class="text-slate-500">Name</dt>
          <dd class="mt-0.5 font-medium text-slate-900">${escapeHtml(user.name)}</dd>
        </div>
        <div>
          <dt class="text-slate-500">Email</dt>
          <dd class="mt-0.5 font-medium text-slate-900">${escapeHtml(user.email)}</dd>
        </div>
        <div>
          <dt class="text-slate-500">Phone</dt>
          <dd class="mt-0.5 font-medium text-slate-900">${escapeHtml(user.phone)}</dd>
        </div>
        <div>
          <dt class="text-slate-500">KYC</dt>
          <dd class="mt-1">${statusBadge(user.kyc_status)}</dd>
        </div>
        <div>
          <dt class="text-slate-500">Credit score</dt>
          <dd class="mt-0.5 font-medium text-slate-900">${user.credit_score ?? '—'}</dd>
        </div>
        <div>
          <dt class="text-slate-500">Approved limit</dt>
          <dd class="mt-0.5 font-medium text-slate-900">${formatINR(user.approved_limit)}</dd>
        </div>
      </dl>
    `;
  })
  .catch((err) => showNotification(err.message, 'error'));
