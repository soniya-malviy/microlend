if (!requireAuth()) throw new Error('auth');

renderAppShell('help');

const steps = [
  {
    title: 'Verify KYC',
    href: '/kyc.html',
    cta: 'Go to KYC',
    image: '/images/help-kyc.png',
    body: 'Open KYC and submit Aadhaar or PAN with the name on the ID. This demo cannot call UIDAI or NSDL, so we only check format.',
    hint: 'Try Aadhaar 2345 6789 0124 or PAN ABCPE1234F.',
  },
  {
    title: 'Generate a credit score',
    href: '/credit-score.html',
    cta: 'Go to credit score',
    image: '/images/help-score.png',
    body: 'After KYC is verified, enter monthly income, existing debt, and employment type. You get a score and an approved INR limit.',
    hint: 'Scoring is blocked until KYC status is verified.',
  },
  {
    title: 'Request a loan',
    href: '/dashboard.html',
    cta: 'Go to dashboard',
    image: '/images/help-loan.png',
    body: 'On the dashboard, tap Request disbursement and enter an amount up to your approved limit. The loan stays pending until payment is captured.',
    hint: 'The request button stays disabled until you have a limit.',
  },
  {
    title: 'Pay to disburse',
    href: '/loans.html',
    cta: 'Go to loans',
    image: '/images/help-pay.png',
    body: 'Open the loan and tap Pay securely. Complete Razorpay test checkout with UPI, card, or netbanking.',
    hint: 'Test card 4111 1111 1111 1111, any future expiry, any CVV.',
  },
];

let index = 0;
let timer = null;

const track = document.getElementById('help-track');
const dotsRoot = document.getElementById('help-dots');
const thumbsRoot = document.getElementById('help-thumbs');
const detail = document.getElementById('help-detail');
const carousel = document.getElementById('help-carousel');

function renderDots() {
  dotsRoot.innerHTML = steps
    .map((_, i) => `<button type="button" data-go="${i}" class="${i === index ? 'is-active' : ''}" aria-label="Go to step ${i + 1}"></button>`)
    .join('');
}

function renderThumbs() {
  thumbsRoot.innerHTML = steps
    .map(
      (step, i) => `
      <button type="button" data-go="${i}" class="group overflow-hidden rounded-2xl text-left ring-1 transition ${
        i === index ? 'ring-2 ring-indigo-500' : 'ring-slate-100 hover:ring-indigo-200'
      }">
        <img src="${step.image}" alt="" class="h-24 w-full object-cover" />
        <span class="block bg-white px-3 py-2">
          <span class="text-[10px] font-semibold uppercase tracking-wide text-indigo-500">Step ${i + 1}</span>
          <span class="mt-0.5 block text-xs font-semibold text-slate-900">${step.title}</span>
        </span>
      </button>`
    )
    .join('');
}

function renderDetail() {
  const step = steps[index];
  detail.innerHTML = `
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="max-w-2xl">
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-500">Step ${index + 1} of ${steps.length}</p>
        <h2 class="mt-1 text-lg font-semibold text-slate-900">${step.title}</h2>
        <p class="mt-2 text-sm leading-6 text-slate-600">${step.body}</p>
        <p class="mt-2 text-xs text-slate-500">${step.hint}</p>
      </div>
      <a href="${step.href}" class="inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">${step.cta}</a>
    </div>
  `;
}

function go(next) {
  index = (next + steps.length) % steps.length;
  track.style.transform = `translateX(-${index * 100}%)`;
  renderDots();
  renderThumbs();
  renderDetail();
}

function startAuto() {
  stopAuto();
  timer = setInterval(() => go(index + 1), 5500);
}

function stopAuto() {
  if (timer) clearInterval(timer);
  timer = null;
}

document.getElementById('help-prev').addEventListener('click', () => {
  go(index - 1);
  startAuto();
});
document.getElementById('help-next').addEventListener('click', () => {
  go(index + 1);
  startAuto();
});
dotsRoot.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-go]');
  if (!btn) return;
  go(Number(btn.dataset.go));
  startAuto();
});
thumbsRoot.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-go]');
  if (!btn) return;
  go(Number(btn.dataset.go));
  startAuto();
});
carousel.addEventListener('mouseenter', stopAuto);
carousel.addEventListener('mouseleave', startAuto);

let startX = 0;
carousel.addEventListener('touchstart', (event) => {
  startX = event.changedTouches[0].clientX;
  stopAuto();
}, { passive: true });
carousel.addEventListener('touchend', (event) => {
  const dx = event.changedTouches[0].clientX - startX;
  if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
  startAuto();
}, { passive: true });

go(0);
startAuto();
