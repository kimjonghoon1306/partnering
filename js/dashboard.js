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
  if (pageId === 'links') { loadCatalog(); loadLinks(); }
  if (pageId === 'overview') loadOverview();
  if (pageId === 'earnings') loadEarnings();
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

// ── 온종일팜 상품 카탈로그 (링크 받기)
let __catalog = [];
async function loadCatalog() {
  const grid = document.getElementById('catalog-grid');
  if (!grid || !window.opClient) return;
  const [prodRes, commRes] = await Promise.all([
    window.opClient.from('products').select('id,name,retail_price,image_url,unit').eq('is_active', true).order('created_at', { ascending: false }),
    window.opClient.from('product_commissions').select('product_id,commission_rate')
  ]);
  if (prodRes.error) { grid.innerHTML = '<div class="catalog-empty">상품을 불러오지 못했어요.</div>'; return; }
  const rateMap = {};
  (commRes.data || []).forEach(c => { rateMap[c.product_id] = Number(c.commission_rate); });
  __catalog = (prodRes.data || []).map(p => Object.assign({}, p, { rate: (rateMap[p.id] != null ? rateMap[p.id] : 0.05) }));
  const cnt = document.getElementById('catalog-count');
  if (cnt) cnt.textContent = '(' + __catalog.length + ')';
  renderCatalog(__catalog);
}
function renderCatalog(list) {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;
  if (!list.length) { grid.innerHTML = '<div class="catalog-empty">상품이 없어요.</div>'; return; }
  grid.innerHTML = list.map(function (p) {
    const price = Number(p.retail_price) || 0;
    const earn = Math.round(price * p.rate);
    const img = (p.image_url && /^https?:\/\//.test(p.image_url) && p.image_url.length > 30) ? p.image_url : '';
    return '<div class="catalog-card">' +
      '<div class="catalog-img" style="' + (img ? "background-image:url('" + escHtml(img) + "')" : '') + '">' + (img ? '' : '🛒') + '</div>' +
      '<div class="catalog-info">' +
        '<div class="catalog-name">' + escHtml(p.name) + '</div>' +
        '<div class="catalog-price">₩' + price.toLocaleString() + '<span>/' + escHtml(p.unit || '개') + '</span></div>' +
        '<div class="catalog-earn">내 수익 <b>₩' + earn.toLocaleString() + '</b><span class="catalog-rate">' + Math.round(p.rate * 100) + '%</span></div>' +
        '<button class="catalog-getlink btn-primary" data-id="' + escHtml(p.id) + '">🔗 링크 받기</button>' +
      '</div>' +
    '</div>';
  }).join('');
}
document.getElementById('catalog-search')?.addEventListener('input', function () {
  const q = this.value.toLowerCase();
  renderCatalog(__catalog.filter(p => (p.name || '').toLowerCase().includes(q)));
});
document.getElementById('catalog-grid')?.addEventListener('click', async function (e) {
  const btn = e.target.closest('.catalog-getlink');
  if (!btn) return;
  const p = __catalog.find(x => x.id === btn.dataset.id);
  if (!p || !window.opClient) return;
  const t = btn.textContent; btn.disabled = true; btn.textContent = '생성 중...';
  const { data: { user } } = await window.opClient.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return; }
  const code = Math.random().toString(36).slice(2, 8);
  const { error } = await window.opClient.from('partner_links').insert({
    partner_id: user.id, code,
    product_url: 'https://app.yuanfnb.com/shop/product/' + p.id,
    product_id: p.id, product_name: p.name, product_image: p.image_url || null,
    product_price: Number(p.retail_price) || 0, commission_rate: p.rate, title: p.name
  });
  btn.disabled = false; btn.textContent = t;
  if (error) { alert('링크 생성 실패: ' + error.message); return; }
  showLinkToast('on.partner/r/' + code);
  loadLinks();
});
function showLinkToast(url) {
  const t = document.getElementById('linktoast');
  const u = document.getElementById('linktoast-url');
  if (!t) return;
  if (u) u.textContent = url;
  t.style.display = 'flex';
}
document.getElementById('linktoast-copy')?.addEventListener('click', function () {
  const url = document.getElementById('linktoast-url')?.textContent || '';
  navigator.clipboard?.writeText(url).then(() => { this.textContent = '복사됨!'; setTimeout(() => this.textContent = '복사', 1500); }).catch(() => {});
});
document.getElementById('linktoast-x')?.addEventListener('click', function () {
  const t = document.getElementById('linktoast'); if (t) t.style.display = 'none';
});

// ── 내 링크 목록 (실데이터)
async function loadLinks() {
  if (!window.opClient) return;
  const tbody = document.querySelector('#links-table tbody');
  const titleEl = document.querySelector('#page-links .table-title');
  const { data, error } = await window.opClient.from('partner_links')
    .select('code,product_url,title,clicks,conversions,created_at')
    .order('created_at', { ascending: false });
  if (error) { console.warn('[온파트너] 링크 조회 오류:', error.message); return; }
  if (titleEl) titleEl.textContent = '전체 링크 (' + data.length + ')';
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:44px;color:var(--text3);font-size:14px;line-height:1.6;">아직 만든 링크가 없어요.<br>위에서 온종일팜 상품 URL로 첫 링크를 만들어보세요! 🔗</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(function (l) {
    let shop = '—'; try { shop = new URL(l.product_url).hostname; } catch (e) {}
    const name = l.title || '온종일팜 상품';
    const purl = 'on.partner/r/' + l.code;
    const date = (l.created_at || '').slice(0, 10).replace(/-/g, '.');
    return '<tr>' +
      '<td><div class="td-link">' + escHtml(name) + '</div></td>' +
      '<td><div class="td-url" title="' + purl + '">' + purl + '</div></td>' +
      '<td><div class="td-url">' + escHtml(shop) + '</div></td>' +
      '<td class="td-num">' + (l.clicks || 0) + '</td>' +
      '<td class="td-num">' + (l.conversions || 0) + '</td>' +
      '<td class="td-earn">₩0</td>' +
      '<td style="font-size:12px;color:var(--text3)">' + date + '</td>' +
      '<td><span class="status-pill active">● 활성</span></td>' +
      '</tr>';
  }).join('');
}
function escHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

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
  showPage('overview');   // → loadOverview() 실집계 호출
  updateChart('7d');
});

// 숫자 카운트업
function countUpEl(el, target, prefix, suffix, isFloat) {
  const start = performance.now();
  const duration = 1000;
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const val = ease * (target || 0);
    el.textContent = (prefix || '') + (isFloat ? val.toFixed(1) : Math.floor(val).toLocaleString()) + (suffix || '');
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

// ── 오버뷰 실집계
async function loadOverview() {
  if (!window.opClient) return;
  const [linkRes, convRes] = await Promise.all([
    window.opClient.from('partner_links').select('product_name,title,product_url,clicks,conversions,created_at').order('created_at', { ascending: false }),
    window.opClient.from('conversions').select('commission_amount,status')
  ]);
  const links = linkRes.data || [];
  const convs = convRes.data || [];
  const totalClicks = links.reduce((s, l) => s + (l.clicks || 0), 0);
  const totalConv = links.reduce((s, l) => s + (l.conversions || 0), 0);
  const revenue = convs.filter(c => c.status !== 'canceled').reduce((s, c) => s + Number(c.commission_amount || 0), 0);
  const rate = totalClicks ? (totalConv / totalClicks * 100) : 0;
  const vals = [revenue, totalClicks, totalConv, rate];
  document.querySelectorAll('#page-overview .summary-grid .s-value').forEach((el, i) => {
    countUpEl(el, vals[i] || 0, el.dataset.prefix || '', el.dataset.suffix || '', el.dataset.float === 'true');
  });
  const hasData = totalClicks || revenue;
  document.querySelectorAll('#page-overview .summary-grid .s-change').forEach(el => {
    if (!hasData) { el.textContent = '아직 데이터 없음'; el.className = 's-change neutral'; }
  });
  const tb = document.getElementById('overview-recent');
  if (tb) {
    if (!links.length) {
      tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:36px;color:var(--text3);">아직 링크가 없어요. <b style="color:var(--lime);">내 링크</b>에서 상품 링크를 받아보세요!</td></tr>';
    } else {
      tb.innerHTML = links.slice(0, 5).map(function (l) {
        let shop = '—'; try { shop = new URL(l.product_url).hostname; } catch (e) {}
        const name = l.product_name || l.title || '온종일팜 상품';
        return '<tr><td><div class="td-link">' + escHtml(name) + '</div></td><td><div class="td-url">' + escHtml(shop) + '</div></td><td class="td-num">' + (l.clicks || 0) + '</td><td class="td-num">' + (l.conversions || 0) + '</td><td class="td-earn">₩0</td><td><span class="status-pill active">● 활성</span></td></tr>';
      }).join('');
    }
  }
}

// ── 수익현황 실집계
async function loadEarnings() {
  if (!window.opClient) return;
  const { data } = await window.opClient.from('conversions').select('commission_amount,status,created_at');
  const convs = data || [];
  const now = new Date();
  const curYM = now.getFullYear() * 12 + now.getMonth();
  const ym = (d) => { const x = new Date(d); return x.getFullYear() * 12 + x.getMonth(); };
  const sum = (arr) => arr.reduce((s, c) => s + Number(c.commission_amount || 0), 0);
  const valid = convs.filter(c => c.status !== 'canceled');
  const thisMonth = sum(valid.filter(c => ym(c.created_at) === curYM));
  const lastMonth = sum(valid.filter(c => ym(c.created_at) === curYM - 1));
  const total = sum(valid);
  const pending = sum(convs.filter(c => c.status === 'pending' || c.status === 'confirmed'));
  const vals = [thisMonth, lastMonth, total, pending];
  document.querySelectorAll('#page-earnings .summary-grid .s-value').forEach((el, i) => {
    countUpEl(el, vals[i] || 0, '₩', '', false);
  });
  document.querySelectorAll('#page-earnings .summary-grid .s-change').forEach(el => {
    if (!total) { el.textContent = '아직 데이터 없음'; el.className = 's-change neutral'; }
  });
}

// ── 알림 토글 스위치
document.addEventListener('click', (e) => {
  const wrap = e.target.closest('.toggle-wrap');
  if (!wrap) return;
  const track = wrap.querySelector('.toggle-track');
  track.classList.toggle('on');
  wrap.dataset.on = track.classList.contains('on') ? 'true' : 'false';
});
