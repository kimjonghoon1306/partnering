// ── 테마
function initTheme() {
  const saved = localStorage.getItem('ptnr-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);
}
function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ptnr-theme', next);
  updateThemeIcon(next);
}
document.getElementById('theme-btn')?.addEventListener('click', toggleTheme);
initTheme();

// ── 사이드바 네비
const navItems = document.querySelectorAll('.nav-item[data-page]');
const pages    = document.querySelectorAll('.admin-page');

function showPage(id) {
  pages.forEach(p => p.classList.remove('active'));
  navItems.forEach(n => n.classList.remove('active'));
  document.getElementById('sp-' + id)?.classList.add('active');
  document.querySelector(`.nav-item[data-page="${id}"]`)?.classList.add('active');
  const label = document.querySelector(`.nav-item[data-page="${id}"] .nav-label`)?.textContent || '';
  const topbar = document.querySelector('.topbar-title');
  if (topbar && label) topbar.textContent = label;
}

navItems.forEach(item => {
  item.addEventListener('click', () => {
    showPage(item.dataset.page);
    if (window.innerWidth <= 768) closeSidebar();
  });
});

// ── 모바일 사이드바
const sidebar   = document.querySelector('.sidebar');
const overlay   = document.querySelector('.admin-sidebar-overlay');
const hamburger = document.querySelector('.admin-hamburger');
function closeSidebar() { sidebar?.classList.remove('open'); overlay?.classList.remove('show'); }
hamburger?.addEventListener('click', () => { sidebar?.classList.add('open'); overlay?.classList.add('show'); });
overlay?.addEventListener('click', closeSidebar);

// ── 수수료 슬라이더
document.querySelectorAll('.rate-slider').forEach(slider => {
  const id = slider.dataset.cat;
  const display = document.getElementById('rv-' + id);
  slider.addEventListener('input', () => {
    if (display) display.textContent = slider.value + '%';
  });
});

// ── 트래커 코드 복사
function copyCode(id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard?.writeText(el.textContent.trim()).then(() => {
    showToast('코드 복사됨 ✅');
  }).catch(() => {});
}

// ── 정산 처리 모달
function openPayModal(partner, amount) {
  document.getElementById('pay-partner').textContent = partner;
  document.getElementById('pay-amount').textContent  = amount;
  document.getElementById('pay-modal').classList.add('show');
}
function closePayModal() {
  document.getElementById('pay-modal').classList.remove('show');
}
function confirmPay() {
  closePayModal();
  showToast('정산 처리 완료 ✅');
}
document.getElementById('pay-modal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('pay-modal')) closePayModal();
});

// ── 검색
document.querySelectorAll('.admin-search').forEach(input => {
  input.addEventListener('input', function() {
    const q = this.value.toLowerCase();
    const table = document.getElementById(this.dataset.table);
    table?.querySelectorAll('tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
});

// ── 토스트
function showToast(msg) {
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--dark3);border:1px solid var(--lime-border);color:var(--lime);padding:12px 24px;border-radius:12px;font-size:14px;font-weight:700;z-index:9999;white-space:nowrap;';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

// ── 오버뷰 SVG 차트
function drawChart() {
  const svg = document.getElementById('shop-chart');
  if (!svg) return;
  const data   = [12, 18, 14, 24, 22, 19, 31, 28, 35, 33, 42, 48];
  const labels = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  const W = 620, H = 130, PL = 8, PR = 8, PT = 8, PB = 22;
  const cW = W - PL - PR, cH = H - PT - PB;
  const max = Math.max(...data), min = Math.min(...data) * 0.8;

  const pts = data.map((v, i) => ({
    x: PL + (i / (data.length - 1)) * cW,
    y: PT + (1 - (v - min) / (max - min)) * cH,
  }));

  const d  = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const ad = d + ` L${pts[pts.length-1].x.toFixed(1)},${PT+cH} L${PL},${PT+cH} Z`;

  svg.querySelector('.sc-area')?.setAttribute('d', ad);
  svg.querySelector('.sc-line')?.setAttribute('d', d);
  const dg = svg.querySelector('.sc-dots');
  if (dg) dg.innerHTML = pts.map((p, i) =>
    `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i===pts.length-1?5:3}"
      fill="${i===pts.length-1?'var(--lime)':'var(--dark3)'}" stroke="var(--lime)" stroke-width="1.5"/>`
  ).join('');
  const lg = svg.querySelector('.sc-labels');
  if (lg) lg.innerHTML = labels.map((l, i) => {
    const x = PL + (i / (labels.length - 1)) * cW;
    return `<text x="${x.toFixed(1)}" y="${H}" text-anchor="middle" fill="var(--text3)" font-size="10" font-family="inherit">${l}</text>`;
  }).join('');
}

// ── 진행바 애니메이션
function animateBars() {
  document.querySelectorAll('.progress-bar-fill[data-w]').forEach(el => {
    setTimeout(() => { el.style.width = el.dataset.w; }, 300);
  });
}

// ── 초기화
document.addEventListener('DOMContentLoaded', () => {
  showPage('overview');
  drawChart();
  animateBars();
});
