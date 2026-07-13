// ── 테마 토글
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
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ptnr-theme', next);
  updateThemeIcon(next);
}
document.getElementById('theme-btn')?.addEventListener('click', toggleTheme);
initTheme();

// ── 사이드바 네비게이션
const navItems = document.querySelectorAll('.nav-item[data-page]');
const pages = document.querySelectorAll('.page');

function showPage(pageId) {
  pages.forEach(p => p.classList.remove('active'));
  navItems.forEach(n => n.classList.remove('active'));
  const targetPage = document.getElementById('page-' + pageId);
  const targetNav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (targetPage) targetPage.classList.add('active');
  if (targetNav) targetNav.classList.add('active');
  const title = targetNav ? targetNav.querySelector('.nav-label')?.textContent : '';
  const topbarTitle = document.querySelector('.topbar-title');
  if (topbarTitle && title) topbarTitle.textContent = title;
}

navItems.forEach(item => {
  item.addEventListener('click', () => {
    showPage(item.dataset.page);
    if (window.innerWidth <= 768) closeSidebar();
  });
});

// ── 모바일 사이드바
const sidebar = document.querySelector('.sidebar');
const overlay = document.querySelector('.sidebar-overlay');
const hamburger = document.querySelector('.hamburger');

function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
  document.body.style.overflow = '';
}

hamburger?.addEventListener('click', openSidebar);
overlay?.addEventListener('click', closeSidebar);

// ── 기간 버튼
document.querySelectorAll('.period-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const group = this.closest('.chart-period');
    group.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    if (this.dataset.range) updateChart(this.dataset.range);
  });
});

// ── 수익 라인 차트 (SVG)
const chartData = {
  '7d': {
    labels: ['6/16','6/17','6/18','6/19','6/20','6/21','6/22'],
    values: [28000, 35000, 22000, 48000, 41000, 56000, 63000]
  },
  '1m': {
    labels: ['6/1','6/5','6/10','6/15','6/20','6/25','6/30'],
    values: [95000, 118000, 87000, 142000, 165000, 128000, 198000]
  },
  '3m': {
    labels: ['4월','4월말','5월초','5월','5월말','6월','6월말'],
    values: [280000, 320000, 295000, 410000, 388000, 456000, 520000]
  }
};

function updateChart(range) {
  const data = chartData[range];
  if (!data) return;
  const svg = document.getElementById('earnings-chart');
  if (!svg) return;

  const W = 580, H = 140, PAD = { top: 10, right: 10, bottom: 28, left: 10 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const max = Math.max(...data.values);
  const min = Math.min(...data.values) * 0.8;
  const range_v = max - min;

  const points = data.values.map((v, i) => ({
    x: PAD.left + (i / (data.values.length - 1)) * chartW,
    y: PAD.top + (1 - (v - min) / range_v) * chartH,
    v
  }));

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = pathD + ` L${points[points.length-1].x.toFixed(1)},${(PAD.top+chartH).toFixed(1)} L${PAD.left},${(PAD.top+chartH).toFixed(1)} Z`;

  // 라인
  const lineEl = svg.querySelector('.chart-line');
  if (lineEl) lineEl.setAttribute('d', pathD);

  // 영역
  const areaEl = svg.querySelector('.chart-area');
  if (areaEl) areaEl.setAttribute('d', areaD);

  // 점
  const dotsG = svg.querySelector('.chart-dots');
  if (dotsG) {
    dotsG.innerHTML = points.map((p, i) =>
      `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i === points.length-1 ? 5 : 3.5}"
        fill="${i === points.length-1 ? '#BEFF00' : 'var(--dark3)'}"
        stroke="#BEFF00" stroke-width="1.5"
        data-val="${p.v.toLocaleString()}" data-label="${data.labels[i]}"/>`
    ).join('');
  }

  // 레이블
  const labelsG = svg.querySelector('.chart-x-labels');
  if (labelsG) {
    labelsG.innerHTML = data.labels.map((l, i) => {
      const x = PAD.left + (i / (data.labels.length - 1)) * chartW;
      return `<text x="${x.toFixed(1)}" y="${H}" text-anchor="middle" fill="rgba(255,255,255,0.28)" font-size="10" font-family="inherit">${l}</text>`;
    }).join('');
  }
}

// ── 링크 복사
document.querySelectorAll('.gen-result').forEach(el => {
  el.addEventListener('click', function() {
    const text = this.querySelector('span')?.textContent || '';
    navigator.clipboard?.writeText(text).then(() => {
      const btn = this.querySelector('.copy-btn-text');
      if (btn) { btn.textContent = '복사됨!'; setTimeout(() => btn.textContent = '복사', 1500); }
    }).catch(() => {});
  });
});

// ── 링크 생성 버튼
const genInputEl = document.getElementById('gen-url-input');
const genResultEl = document.getElementById('gen-result-url');
const genBtnEl = document.getElementById('gen-btn');

genBtnEl?.addEventListener('click', () => {
  const url = genInputEl?.value?.trim();
  if (!url) return;
  const code = Math.random().toString(36).slice(2, 8);
  const domain = url.split('/')[2] || 'shop';
  const generated = `on.partner/r/${code}?ref=myid`;
  if (genResultEl) {
    const span = genResultEl.querySelector('span');
    if (span) span.textContent = generated;
    genResultEl.style.display = 'flex';
  }
});

// ── 검색 필터
const searchEl = document.getElementById('links-search');
searchEl?.addEventListener('input', function() {
  const q = this.value.toLowerCase();
  document.querySelectorAll('#links-table tbody tr').forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(q) ? '' : 'none';
  });
});

// ── 초기화
document.addEventListener('DOMContentLoaded', () => {
  showPage('overview');
  updateChart('7d');

  // 카운트업 애니메이션
  document.querySelectorAll('.s-value[data-target]').forEach(el => {
    const target = parseFloat(el.dataset.target);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const isFloat = el.dataset.float === 'true';
    const start = performance.now();
    const duration = 1200;
    const update = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = ease * target;
      el.textContent = prefix + (isFloat ? val.toFixed(1) : Math.floor(val).toLocaleString()) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  });
});

// ── 알림 토글 스위치
document.addEventListener('click', (e) => {
  const wrap = e.target.closest('.toggle-wrap');
  if (!wrap) return;
  const track = wrap.querySelector('.toggle-track');
  track.classList.toggle('on');
  wrap.dataset.on = track.classList.contains('on') ? 'true' : 'false';
});
