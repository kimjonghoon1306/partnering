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
  if (pageId === 'settlement') loadSettlement();
  if (pageId === 'settings') loadSettings();
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
  const [prodRes, commRes, linkRes] = await Promise.all([
    window.opClient.from('products').select('id,name,retail_price,image_url,unit').eq('is_active', true).order('created_at', { ascending: false }),
    window.opClient.from('product_commissions').select('product_id,commission_rate'),
    window.opClient.from('partner_links').select('code,product_id')
  ]);
  if (prodRes.error) { grid.innerHTML = '<div class="catalog-empty">상품을 불러오지 못했어요.</div>'; return; }
  const rateMap = {};
  (commRes.data || []).forEach(c => { rateMap[c.product_id] = Number(c.commission_rate); });
  const myCodeMap = {};
  (linkRes.data || []).forEach(l => { if (l.product_id) myCodeMap[l.product_id] = l.code; });
  __catalog = (prodRes.data || []).map(p => Object.assign({}, p, { rate: (rateMap[p.id] != null ? rateMap[p.id] : 0.05), myCode: myCodeMap[p.id] || null }));
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
        (p.myCode
          ? '<div class="catalog-mylink"><span title="partner.yuanfnb.com/r/' + p.myCode + '">🔗 partner.yuanfnb.com/r/' + escHtml(p.myCode) + '</span><button class="catalog-copy" data-code="' + escHtml(p.myCode) + '">복사</button></div>' +
            '<button class="catalog-regen" data-id="' + escHtml(p.id) + '">🔄 재발급</button>'
          : '<button class="catalog-getlink btn-primary" data-id="' + escHtml(p.id) + '">🔗 링크 받기</button>') +
      '</div>' +
    '</div>';
  }).join('');
}
document.getElementById('catalog-search')?.addEventListener('input', function () {
  const q = this.value.toLowerCase();
  renderCatalog(__catalog.filter(p => (p.name || '').toLowerCase().includes(q)));
});
document.getElementById('catalog-grid')?.addEventListener('click', async function (e) {
  // 복사
  const copyBtn = e.target.closest('.catalog-copy');
  if (copyBtn) {
    const url = 'https://partner.yuanfnb.com/r/' + copyBtn.dataset.code;
    navigator.clipboard?.writeText(url).then(function () {
      const o = copyBtn.textContent; copyBtn.textContent = '복사됨!';
      setTimeout(function () { copyBtn.textContent = o; }, 1200);
    }).catch(function () {});
    return;
  }
  // 링크 받기(신규) 또는 재발급
  const getBtn = e.target.closest('.catalog-getlink');
  const regenBtn = e.target.closest('.catalog-regen');
  const btn = getBtn || regenBtn;
  if (!btn) return;
  const p = __catalog.find(x => x.id === btn.dataset.id);
  if (!p || !window.opClient) return;
  if (regenBtn && !confirm('재발급하면 기존 링크는 더 이상 작동하지 않아요.\n새 링크로 바꿀까요?')) return;

  const t = btn.textContent; btn.disabled = true; btn.textContent = regenBtn ? '재발급 중...' : '생성 중...';
  const { data: { user } } = await window.opClient.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return; }
  const { data: prof } = await window.opClient.from('partners').select('nickname').maybeSingle();
  const code = makeRefCode(prof && prof.nickname);
  let error;
  if (regenBtn) {
    const r = await window.opClient.from('partner_links').update({ code: code }).eq('partner_id', user.id).eq('product_id', p.id);
    error = r.error;
  } else {
    const r = await window.opClient.from('partner_links').insert({
      partner_id: user.id, code: code,
      product_url: 'https://app.yuanfnb.com/shop/product/' + p.id,
      product_id: p.id, product_name: p.name, product_image: p.image_url || null,
      product_price: Number(p.retail_price) || 0, commission_rate: p.rate, title: p.name
    });
    error = r.error;
  }
  btn.disabled = false; btn.textContent = t;
  if (error) { alert('링크 처리 실패: ' + error.message); return; }
  showLinkToast('https://partner.yuanfnb.com/r/' + code);
  loadCatalog();
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
  setLinkBadge(data.length);
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:44px;color:var(--text3);font-size:14px;line-height:1.6;">아직 만든 링크가 없어요.<br>위에서 온종일팜 상품 URL로 첫 링크를 만들어보세요! 🔗</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(function (l) {
    let shop = '—'; try { shop = new URL(l.product_url).hostname; } catch (e) {}
    const name = l.title || '온종일팜 상품';
    const purl = 'partner.yuanfnb.com/r/' + l.code;
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
      '<td style="text-align:right;"><button class="link-del-btn" onclick="deleteLink(\'' + escHtml(l.code) + '\',this)" title="링크 삭제">🗑 삭제</button></td>' +
      '</tr>';
  }).join('');
}

// ── 링크 삭제
async function deleteLink(code, btn) {
  if (!window.opClient) return;
  if (!confirm('이 링크를 삭제할까요?\n삭제하면 이 링크로는 더 이상 클릭·구매가 추적되지 않아요.')) return;
  btn.disabled = true; const t = btn.textContent; btn.textContent = '삭제 중...';
  const { error } = await window.opClient.from('partner_links').delete().eq('code', code);
  if (error) { btn.disabled = false; btn.textContent = t; alert('삭제 실패: ' + error.message); return; }
  loadLinks();      // 목록·배지 갱신
  loadCatalog();    // 카탈로그 '링크 받기' 상태 복구
}
function escHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

// 추천 링크 코드: 닉네임 기반(kjhyun-3f2a). 닉네임 없거나 영숫자 아니면 랜덤.
function makeRefCode(nick) {
  const base = String(nick || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12);
  const rand = Math.random().toString(36).slice(2, 6);
  return base ? base + '-' + rand : Math.random().toString(36).slice(2, 8);
}

// ── 검색 필터
const searchEl = document.getElementById('links-search');
searchEl?.addEventListener('input', function() {
  const q = this.value.toLowerCase();
  document.querySelectorAll('#links-table tbody tr').forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(q) ? '' : 'none';
  });
});

// ── 사이드바 파트너 정보 (실제 가입 이름)
async function loadPartnerHeader() {
  if (!window.opClient) return;
  const [{ data: { user } }, { data: p }, { count }] = await Promise.all([
    window.opClient.auth.getUser(),
    window.opClient.from('partners').select('name,nickname').maybeSingle(),
    window.opClient.from('partner_links').select('id', { count: 'exact', head: true })
  ]);
  const m = (user && user.user_metadata) || {};
  const name = (p && p.name) || m.name;
  const nick = (p && p.nickname) || m.nickname;
  const display = name || nick || '파트너';
  const nameEl = document.querySelector('.user-name');
  const avEl = document.querySelector('.user-avatar');
  const gradeEl = document.querySelector('.user-grade');
  if (nameEl) nameEl.textContent = display;
  if (avEl) avEl.textContent = display.slice(0, 1);
  if (gradeEl) gradeEl.textContent = nick ? '@' + nick : '🌱 파트너';
  setLinkBadge(count || 0);
}
function setLinkBadge(n) {
  const lb = document.getElementById('link-count-badge');
  if (lb) { lb.textContent = n; lb.style.display = n ? '' : 'none'; }
}

// ── 초기화
document.addEventListener('DOMContentLoaded', () => {
  loadPartnerHeader();
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

// ── 정산 실집계
function maskAccount(a) { a = String(a || ''); return a.length > 4 ? '***-**-' + a.slice(-4) : a; }
async function loadSettlement() {
  if (!window.opClient) return;
  const [convRes, pRes, sRes] = await Promise.all([
    window.opClient.from('conversions').select('commission_amount,status'),
    window.opClient.from('partners').select('bank_name,bank_account,bank_holder').maybeSingle(),
    window.opClient.from('settlements').select('period,total_amount,status,paid_at').order('period', { ascending: false })
  ]);
  const convs = convRes.data || [];
  const pending = convs.filter(c => c.status === 'pending' || c.status === 'confirmed').reduce((s, c) => s + Number(c.commission_amount || 0), 0);
  const amtEl = document.getElementById('settle-amount');
  if (amtEl) amtEl.textContent = '₩' + Math.round(pending).toLocaleString();
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const dEl = document.getElementById('settle-nextdate');
  if (dEl) dEl.textContent = next.getFullYear() + '년 ' + (next.getMonth() + 1) + '월 1일';
  const p = pRes.data;
  const acEl = document.getElementById('settle-account');
  if (acEl) acEl.textContent = (p && p.bank_name && p.bank_account) ? (p.bank_name + ' ' + maskAccount(p.bank_account)) : '미등록 (설정에서 등록)';
  const tb = document.getElementById('settle-history');
  const settles = sRes.data || [];
  if (tb) {
    if (!settles.length) {
      tb.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:36px;color:var(--text3);">아직 정산 내역이 없어요. 판매가 쌓이면 매달 자동 정산돼요.</td></tr>';
    } else {
      tb.innerHTML = settles.map(function (s) {
        const done = s.status === 'paid';
        return '<tr><td style="font-size:12px;">' + escHtml(s.period || '') + '</td>' +
          '<td class="td-num">-</td><td style="font-size:12px;color:var(--text2);">-</td><td style="font-size:12px;">-</td>' +
          '<td class="td-earn">₩' + Math.round(Number(s.total_amount || 0)).toLocaleString() + '</td>' +
          '<td>' + (done ? '<span class="status-pill active">✓ 완료</span>' : '<span class="status-pill" style="background:rgba(245,158,11,0.1);color:#fbbf24;border-color:rgba(245,158,11,0.25);">⏳ 예정</span>') + '</td>' +
          '<td style="font-size:12px;color:var(--text3);">' + (s.paid_at ? String(s.paid_at).slice(0, 10).replace(/-/g, '.') : '-') + '</td></tr>';
      }).join('');
    }
  }
}

// ── 설정 (프로필·정산계좌)
async function loadSettings() {
  if (!window.opClient) return;
  const { data: { user } } = await window.opClient.auth.getUser();
  let { data: p, error } = await window.opClient.from('partners').select('*').maybeSingle();
  if (error) console.warn('[온파트너] 설정 로드 오류:', error.message);
  if (!p && user) {
    window.location.href = 'signup.html?mode=partner-register';
    return;
  }
  p = p || {};
  const m = (user && user.user_metadata) || {};
  const g = (k) => (p[k] != null && p[k] !== '') ? p[k] : m[k];   // partners 우선, 없으면 metadata 폴백
  const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
  setVal('set-name', g('name'));
  setVal('set-nick', g('nickname'));
  setVal('set-phone', g('phone') || m.contact);   // 온종일팜 계정은 contact 키
  setVal('set-email', p.email || (user && user.email));
  setVal('set-channels', (g('channels') || []).join(', '));
  setVal('set-categories', (g('categories') || []).join(', '));
  setVal('set-account', p.bank_account);
  setVal('set-holder', p.bank_holder);
  const bankEl = document.getElementById('set-bank');
  if (bankEl && p.bank_name) bankEl.value = p.bank_name;
  const av = document.getElementById('set-avatar');
  const dispName = g('name') || g('nickname');
  if (av && dispName) av.textContent = dispName.slice(0, 1);
  const cur = document.getElementById('set-cur-account');
  const curH = document.getElementById('set-cur-holder');
  if (cur) cur.textContent = (p.bank_name && p.bank_account) ? (p.bank_name + ' ' + maskAccount(p.bank_account)) : '미등록';
  if (curH) curH.textContent = p.bank_holder ? ('예금주: ' + p.bank_holder) : '';
}
async function saveProfile(btn) {
  if (!window.opClient) return;
  const name = document.getElementById('set-name')?.value.trim();
  const nickname = document.getElementById('set-nick')?.value.trim() || null;
  const phone = document.getElementById('set-phone')?.value.trim() || null;
  if (!name) { alert('이름(실명)을 입력해주세요.'); return; }
  const splitList = (id) => (document.getElementById(id)?.value || '').split(',').map(s => s.trim()).filter(Boolean);
  const channels = splitList('set-channels');
  const categories = splitList('set-categories');
  const { data: { user } } = await window.opClient.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return; }
  const t = btn.textContent; btn.disabled = true; btn.textContent = '저장 중...';
  const { error } = await window.opClient.from('partners')
    .update({ name, nickname, phone, channels, categories }).eq('id', user.id);
  btn.disabled = false; btn.textContent = t;
  if (error) { alert('저장 실패: ' + error.message); return; }
  const av = document.getElementById('set-avatar'); if (av) av.textContent = name.slice(0, 1);
  loadPartnerHeader();   // 사이드바 이름·아바타 즉시 갱신
  alert('프로필이 저장됐어요!');
}
async function saveBank(btn) {
  if (!window.opClient) return;
  const bank_name = document.getElementById('set-bank')?.value;
  const bank_account = document.getElementById('set-account')?.value.trim();
  const bank_holder = document.getElementById('set-holder')?.value.trim();
  if (!bank_account || !bank_holder) { alert('계좌번호와 예금주를 입력해주세요.'); return; }
  const { data: { user } } = await window.opClient.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return; }
  const t = btn.textContent; btn.disabled = true; btn.textContent = '저장 중...';
  const { error } = await window.opClient.from('partners').update({ bank_name, bank_account, bank_holder }).eq('id', user.id);
  btn.disabled = false; btn.textContent = t;
  if (error) { alert('저장 실패: ' + error.message); return; }
  alert('정산 계좌가 등록됐어요!');
  loadSettings();
}

// ── 비밀번호 변경
async function changePassword(btn) {
  if (!window.opClient) return;
  const pw = document.getElementById('set-pw-new')?.value || '';
  const pw2 = document.getElementById('set-pw-confirm')?.value || '';
  if (pw.length < 8) { alert('비밀번호는 8자 이상이어야 해요.'); return; }
  if (pw !== pw2) { alert('새 비밀번호가 일치하지 않아요.'); return; }
  const t = btn.textContent; btn.disabled = true; btn.textContent = '변경 중...';
  const { error } = await window.opClient.auth.updateUser({ password: pw });
  btn.disabled = false; btn.textContent = t;
  if (error) { alert('변경 실패: ' + error.message); return; }
  document.getElementById('set-pw-new').value = '';
  document.getElementById('set-pw-confirm').value = '';
  alert('비밀번호가 변경됐어요!');
}

// ── 온파트너 파트너 탈퇴: auth.users는 유지하고 partners row만 삭제
async function withdrawPartner(btn) {
  if (!window.opClient) return;
  const ok = confirm('온파트너 파트너를 탈퇴하면 발급한 링크·수익 내역이 모두 삭제됩니다. 온종일팜 계정과 쿠폰은 그대로 유지됩니다. 정말 탈퇴하시겠어요?');
  if (!ok) return;

  const { data: { user } } = await window.opClient.auth.getUser();
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  const t = btn?.textContent || '온파트너 파트너 탈퇴';
  if (btn) { btn.disabled = true; btn.textContent = '탈퇴 처리 중...'; }
  const { error } = await window.opClient.from('partners').delete().eq('id', user.id);
  if (error) {
    if (btn) { btn.disabled = false; btn.textContent = t; }
    alert('탈퇴 처리에 실패했어요: ' + error.message);
    return;
  }

  await window.opClient.auth.signOut();
  alert('탈퇴가 완료됐어요. 언제든 다시 파트너로 가입하실 수 있어요.');
  window.location.href = '../index.html';
}

// ── 알림 토글 스위치
document.addEventListener('click', (e) => {
  const wrap = e.target.closest('.toggle-wrap');
  if (!wrap) return;
  const track = wrap.querySelector('.toggle-track');
  track.classList.toggle('on');
  wrap.dataset.on = track.classList.contains('on') ? 'true' : 'false';
});
