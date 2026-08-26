if (!requireAuth()) throw new Error('auth');

renderAppShell('help');

const slideCount = document.querySelectorAll('.help-slide').length;
let index = 0;
let timer = null;

const track = document.getElementById('help-track');
const stepsTrack = document.getElementById('help-steps-track');
const dotsRoot = document.getElementById('help-dots');
const carousel = document.getElementById('help-carousel');
const stepsBox = document.getElementById('help-steps');

function renderDots() {
  dotsRoot.innerHTML = Array.from({ length: slideCount }, (_, i) => (
    `<button type="button" data-go="${i}" class="${i === index ? 'is-active' : ''}" aria-label="Go to step ${i + 1}"></button>`
  )).join('');
}

function go(next) {
  index = (next + slideCount) % slideCount;
  const offset = `translateX(-${index * 100}%)`;
  track.style.transform = offset;
  if (stepsTrack) stepsTrack.style.transform = offset;
  renderDots();
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
carousel.addEventListener('mouseenter', stopAuto);
carousel.addEventListener('mouseleave', startAuto);
if (stepsBox) {
  stepsBox.addEventListener('mouseenter', stopAuto);
  stepsBox.addEventListener('mouseleave', startAuto);
}

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
