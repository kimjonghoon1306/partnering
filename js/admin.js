// ── 관리자 인증 확인 (Supabase 세션 + is_admin)
(async function () {
  if (!window.opClient) { window.location.href = 'admin-login.html'; return; }
  const { data: { session } } = await window.opClient.auth.getSession();
  if (!session) { window.location.replace('admin-login.html'); return; }
  const { data: isAdmin } = await window.opClient.rpc('is_admin');
  if (!isAdmin) { await window.opClient.auth.signOut(); window.location.replace('admin-login.html'); return; }
})();

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
  const cur = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ptnr-theme', next);
  updateThemeIcon(next);
}
document.getElementById('theme-btn')?.addEventListener('click', toggleTheme);
initTheme();

// ── 사이드바 네비
const adminNavItems = document.querySelectorAll('.admin-nav-item[data-page]');
const adminPages = document.querySelectorAll('.admin-page');

function showAdminPage(pageId) {
  adminPages.forEach(p => p.classList.remove('active'));
  adminNavItems.forEach(n => n.classList.remove('active'));
  const page = document.getElementById('ap-' + pageId);
  const nav = document.querySelector(`.admin-nav-item[data-page="${pageId}"]`);
  if (page) page.classList.add('active');
  if (nav) nav.classList.add('active');
  const title = nav?.querySelector('.admin-nav-label')?.textContent || '';
  const topbarTitle = document.querySelector('.admin-topbar-title');
  if (topbarTitle && title) topbarTitle.textContent = title;
  if (pageId === 'commissions') loadCommissions();
  if (pageId === 'campaigns') loadCampaigns();
  if (pageId === 'partners') loadAdminPartners();
  if (pageId === 'overview') loadAdminOverview();
  if (pageId === 'review') loadReview();
  if (pageId === 'settle') loadSettle();
  if (pageId === 'settle-history') loadSettleHistory();
  if (pageId === 'fraud') loadFraud();
}

adminNavItems.forEach(item => {
  item.addEventListener('click', () => {
    showAdminPage(item.dataset.page);
    if (window.innerWidth <= 768) closeAdminSidebar();
  });
});

// ── 모바일 사이드바
const adminSidebar = document.querySelector('.admin-sidebar');
const adminOverlay = document.querySelector('.admin-sidebar-overlay');
const adminHamburger = document.querySelector('.admin-hamburger');

function openAdminSidebar() {
  adminSidebar?.classList.add('open');
  adminOverlay?.classList.add('show');
}
function closeAdminSidebar() {
  adminSidebar?.classList.remove('open');
  adminOverlay?.classList.remove('show');
}
adminHamburger?.addEventListener('click', openAdminSidebar);
adminOverlay?.addEventListener('click', closeAdminSidebar);

// ── 로그아웃
async function adminLogout() {
  await window.opClient?.auth.signOut();
  window.location.href = 'admin-login.html';
}

// ── 모달
function openModal(id) {
  document.getElementById(id)?.classList.add('show');
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('show');
}
document.querySelectorAll('.admin-modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('show');
  });
});

// ── 검색 필터
document.querySelectorAll('.admin-search').forEach(input => {
  input.addEventListener('input', function() {
    const q = this.value.toLowerCase();
    const tableId = this.dataset.table;
    const table = document.getElementById(tableId);
    if (!table) return;
    table.querySelectorAll('tbody tr').forEach(row => {
      row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
});

// ── 필터 버튼
document.querySelectorAll('.admin-filter-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    const group = this.closest('.admin-table-actions');
    group?.querySelectorAll('.admin-filter-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
  });
});

// ── 토스트
function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#141414;border:1px solid rgba(190,255,0,0.3);color:var(--lime);padding:12px 24px;border-radius:12px;font-size:14px;font-weight:700;z-index:9999;animation:fadeUp 0.3s ease;';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

// ── 초기화
document.addEventListener('DOMContentLoaded', () => {
  showAdminPage('overview');
});

// ══════════ 실데이터 연동 ══════════
function admEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

// ── 상품 마진 설정
let __admProducts = [];
async function loadCommissions() {
  const box = document.getElementById('comm-list');
  if (!box || !window.opClient) return;
  const [pRes, cRes] = await Promise.all([
    window.opClient.from('products').select('id,name,retail_price,image_url,is_active').order('created_at', { ascending: false }),
    window.opClient.from('product_commissions').select('product_id,commission_rate')
  ]);
  if (pRes.error) { box.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text3);">상품을 불러오지 못했어요: ' + admEsc(pRes.error.message) + '</div>'; return; }
  const rateMap = {};
  (cRes.data || []).forEach(c => { rateMap[c.product_id] = Math.round(Number(c.commission_rate) * 100); });
  __admProducts = (pRes.data || []).map(p => Object.assign({}, p, { rate: (rateMap[p.id] != null ? rateMap[p.id] : 5) }));
  renderCommissions(__admProducts);
}
function renderCommissions(list) {
  const box = document.getElementById('comm-list');
  if (!box) return;
  if (!list.length) { box.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text3);">상품이 없어요.</div>'; return; }
  box.innerHTML = list.map(p => {
    const price = Number(p.retail_price) || 0;
    const img = (p.image_url && /^https?:\/\//.test(p.image_url) && p.image_url.length > 30) ? p.image_url : '';
    const earn = Math.round(price * p.rate / 100);
    return '<div class="comm-row" data-id="' + admEsc(p.id) + '">' +
      '<div class="comm-thumb" style="' + (img ? "background-image:url('" + admEsc(img) + "')" : '') + '">' + (img ? '' : '🛒') + '</div>' +
      '<div class="comm-info"><div class="comm-name">' + admEsc(p.name) + (p.is_active ? '' : ' <span style="color:var(--text3);font-size:11px;">(비활성)</span>') + '</div>' +
        '<div class="comm-price">판매가 ₩' + price.toLocaleString() + '</div></div>' +
      '<div class="comm-ctrl">' +
        '<input type="range" min="0" max="30" value="' + p.rate + '" class="comm-range" oninput="onCommRange(this)">' +
        '<div class="comm-rate-box"><b class="comm-rate-val">' + p.rate + '</b>%</div>' +
        '<div class="comm-earn">수수료 ₩<span class="comm-earn-val">' + earn.toLocaleString() + '</span></div>' +
        '<button class="comm-save" onclick="saveCommission(this,\'' + admEsc(p.id) + '\')">저장</button>' +
      '</div></div>';
  }).join('');
}
function onCommRange(el) {
  const row = el.closest('.comm-row');
  const rate = Number(el.value);
  row.querySelector('.comm-rate-val').textContent = rate;
  const p = __admProducts.find(x => x.id === row.dataset.id);
  const price = p ? (Number(p.retail_price) || 0) : 0;
  row.querySelector('.comm-earn-val').textContent = Math.round(price * rate / 100).toLocaleString();
  row.querySelector('.comm-save').classList.add('dirty');
}
async function saveCommission(btn, pid) {
  if (!window.opClient) return;
  const row = btn.closest('.comm-row');
  const rate = Number(row.querySelector('.comm-range').value) / 100;
  const t = btn.textContent; btn.disabled = true; btn.textContent = '저장 중...';
  const { data: { user } } = await window.opClient.auth.getUser();
  const { error } = await window.opClient.from('product_commissions')
    .upsert({ product_id: pid, commission_rate: rate, updated_by: user?.id, updated_at: new Date().toISOString() }, { onConflict: 'product_id' });
  btn.disabled = false;
  if (error) { btn.textContent = t; alert('저장 실패: ' + error.message); return; }
  btn.textContent = '✓ 저장됨'; btn.classList.remove('dirty');
  const p = __admProducts.find(x => x.id === pid); if (p) p.rate = Number(row.querySelector('.comm-range').value);
  setTimeout(() => { btn.textContent = '저장'; }, 1500);
}
document.getElementById('comm-search')?.addEventListener('input', function () {
  const q = this.value.toLowerCase();
  renderCommissions(__admProducts.filter(p => (p.name || '').toLowerCase().includes(q)));
});

// ── 파트너 목록
let __admPartners = [];
async function loadAdminPartners() {
  const tb = document.querySelector('#ap-partners table tbody');
  const titleEl = document.querySelector('#ap-partners .admin-table-title');
  if (!window.opClient) return;
  const { data, error } = await window.opClient.from('partners').select('id,name,nickname,email,channels,status,created_at').order('created_at', { ascending: false });
  if (error) { if (tb) tb.innerHTML = '<tr><td colspan="6"><div class="adm-empty">' + admEsc(error.message) + '</div></td></tr>'; return; }
  __admPartners = data || [];
  if (titleEl) titleEl.textContent = '파트너 목록 (' + __admPartners.length + ')';
  renderAdminPartners(__admPartners);
}
function renderAdminPartners(list) {
  const tb = document.querySelector('#ap-partners table tbody');
  if (!tb) return;
  if (!list.length) { tb.innerHTML = '<tr><td colspan="6"><div class="adm-empty"><div class="ico">👥</div><b>가입한 파트너가 없어요</b>파트너가 가입하면 여기에 표시됩니다</div></td></tr>'; return; }
  tb.innerHTML = list.map(p => {
    const suspended = p.status === 'suspended';
    return '<tr>' +
      '<td><b>' + admEsc(p.name || '-') + '</b>' + (p.nickname ? ' <span style="color:var(--text3);font-size:12px;">@' + admEsc(p.nickname) + '</span>' : '') + '</td>' +
      '<td style="color:var(--text2);font-size:13px;">' + admEsc(p.email || '') + '</td>' +
      '<td style="font-size:12px;color:var(--text3);">' + admEsc((p.channels || []).join(', ')) + '</td>' +
      '<td>' + (suspended ? '<span class="status-pill paused">정지</span>' : '<span class="status-pill active">● 활성</span>') + '</td>' +
      '<td style="font-size:12px;color:var(--text3);">' + admEsc(String(p.created_at || '').slice(0, 10)) + '</td>' +
      '<td style="text-align:right;">' + (suspended
        ? '<button class="admin-action-btn approve" onclick="setPartnerStatus(\'' + admEsc(p.id) + '\',\'active\',this)">활성화</button>'
        : '<button class="admin-action-btn reject" onclick="setPartnerStatus(\'' + admEsc(p.id) + '\',\'suspended\',this)">정지</button>') +
      '</td></tr>';
  }).join('');
}
async function setPartnerStatus(id, status, btn) {
  if (!window.opClient) return;
  const label = status === 'suspended' ? '정지' : '활성화';
  if (status === 'suspended' && !confirm('이 파트너를 정지할까요?\n정지하면 로그인은 되지만 링크·수익 활동이 제한됩니다.')) return;
  btn.disabled = true; const t = btn.textContent; btn.textContent = '처리 중...';
  const { error } = await window.opClient.from('partners').update({ status }).eq('id', id);
  btn.disabled = false;
  if (error) { btn.textContent = t; showToast('실패: ' + error.message); return; }
  const p = __admPartners.find(x => x.id === id); if (p) p.status = status;
  renderAdminPartners(__admPartners);
  showToast('파트너 ' + label + ' 완료 ✅');
}
document.getElementById('partner-search')?.addEventListener('input', function () {
  const q = this.value.toLowerCase();
  renderAdminPartners(__admPartners.filter(p => ((p.name || '') + (p.email || '') + (p.nickname || '')).toLowerCase().includes(q)));
});

// ── 관리자 오버뷰 실집계
async function loadAdminOverview() {
  if (!window.opClient) return;
  const [pRes, lRes, cRes, recentPartners, settleRes] = await Promise.all([
    window.opClient.from('partners').select('id', { count: 'exact', head: true }),
    window.opClient.from('partner_links').select('id', { count: 'exact', head: true }),
    window.opClient.from('conversions').select('commission_amount,order_amount,status,created_at,link_id,partner_links(title)').order('created_at', { ascending: false }),
    window.opClient.from('partners').select('name,nickname,created_at').order('created_at', { ascending: false }).limit(5),
    window.opClient.from('settlements').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  ]);
  const convs = cRes.data || [];
  const now = new Date();
  const thisMonth = convs.filter(c => { const d = new Date(c.created_at); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && c.status !== 'canceled'; });
  const monthGmv = thisMonth.reduce((s, c) => s + Number(c.order_amount || 0), 0);
  const monthComm = thisMonth.reduce((s, c) => s + Number(c.commission_amount || 0), 0);

  const cards = document.querySelectorAll('#ap-overview .admin-card-value');
  if (cards[0]) cards[0].textContent = (pRes.count || 0).toLocaleString();
  if (cards[1]) cards[1].textContent = (lRes.count || 0).toLocaleString();
  if (cards[2]) cards[2].textContent = '₩' + Math.round(monthGmv).toLocaleString();
  if (cards[3]) cards[3].textContent = '₩' + Math.round(monthComm).toLocaleString();

  // 처리 대기 카운트
  const pendReview = convs.filter(c => c.status === 'pending').length;
  const rv = document.getElementById('ov-pend-review'); if (rv) rv.textContent = pendReview.toLocaleString();
  const sv = document.getElementById('ov-pend-settle'); if (sv) sv.textContent = (settleRes.count || 0).toLocaleString();

  drawAdminOverviewChart(convs);
  renderTopProducts(convs);
  renderRecentActivity(convs, recentPartners.data || []);
}

// ── 월별 수수료 추이 차트 (실데이터)
function drawAdminOverviewChart(convs) {
  const svg = document.getElementById('admin-chart');
  if (!svg) return;
  const months = [], labels = [];
  const base = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
    months.push({ key: d.getFullYear() + '-' + d.getMonth(), sum: 0 });
    labels.push((d.getMonth() + 1) + '월');
  }
  const idx = {}; months.forEach((m, i) => idx[m.key] = i);
  convs.filter(c => c.status !== 'canceled').forEach(c => {
    const d = new Date(c.created_at); const k = d.getFullYear() + '-' + d.getMonth();
    if (k in idx) months[idx[k]].sum += Number(c.commission_amount || 0);
  });
  const data = months.map(m => m.sum);
  const W = 680, H = 150, PAD = { t: 12, r: 12, b: 26, l: 12 }, cW = W - PAD.l - PAD.r, cH = H - PAD.t - PAD.b;
  const max = Math.max(...data, 1), min = 0;
  const pts = data.map((v, i) => ({ x: PAD.l + (i / (data.length - 1)) * cW, y: PAD.t + (1 - (v - min) / (max - min)) * cH }));
  const pathD = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  svg.querySelector('.ac-area')?.setAttribute('d', pathD + ` L${pts.at(-1).x.toFixed(1)},${PAD.t + cH} L${PAD.l},${PAD.t + cH} Z`);
  svg.querySelector('.ac-line')?.setAttribute('d', pathD);
  const dg = svg.querySelector('.ac-dots');
  if (dg) dg.innerHTML = pts.map((p, i) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i === pts.length - 1 ? 5 : 3}" fill="${i === pts.length - 1 ? '#BEFF00' : '#141414'}" stroke="#BEFF00" stroke-width="1.5"/>`).join('');
  const lg = svg.querySelector('.ac-labels');
  if (lg) lg.innerHTML = labels.map((l, i) => `<text x="${(PAD.l + (i / (labels.length - 1)) * cW).toFixed(1)}" y="${H}" text-anchor="middle" fill="rgba(255,255,255,0.22)" font-size="10">${l}</text>`).join('');
}

// ── 인기 상품 TOP
function renderTopProducts(convs) {
  const box = document.getElementById('ov-top-products');
  if (!box) return;
  const agg = {};
  convs.filter(c => c.status !== 'canceled').forEach(c => {
    const name = (c.partner_links && c.partner_links.title) || '(상품 미상)';
    if (!agg[name]) agg[name] = { name, cnt: 0, sum: 0 };
    agg[name].cnt++; agg[name].sum += Number(c.commission_amount || 0);
  });
  const list = Object.values(agg).sort((a, b) => b.cnt - a.cnt).slice(0, 5);
  if (!list.length) return;
  box.innerHTML = list.map((p, i) =>
    '<div class="adm-list-item"><div class="adm-rank' + (i === 0 ? ' top' : '') + '">' + (i + 1) + '</div>' +
    '<div class="adm-list-thumb">🛒</div>' +
    '<div class="adm-list-main"><div class="adm-list-name">' + admEsc(p.name) + '</div><div class="adm-list-meta">수수료 합계</div></div>' +
    '<div class="adm-list-val">₩' + Math.round(p.sum).toLocaleString() + '<small>' + p.cnt + '건</small></div></div>'
  ).join('');
}

// ── 최근 활동
function renderRecentActivity(convs, partners) {
  const box = document.getElementById('ov-recent');
  if (!box) return;
  const items = [];
  convs.slice(0, 6).forEach(c => items.push({
    t: new Date(c.created_at), cls: 'conv', ico: '💰', title: '수수료 발생',
    meta: ((c.partner_links && c.partner_links.title) || '상품') + ' · +₩' + Math.round(Number(c.commission_amount || 0)).toLocaleString()
  }));
  partners.forEach(p => items.push({
    t: new Date(p.created_at), cls: 'join', ico: '🙋', title: '신규 파트너 가입',
    meta: (p.name || p.nickname || '파트너') + '님이 가입했어요'
  }));
  items.sort((a, b) => b.t - a.t);
  const top = items.slice(0, 6);
  if (!top.length) return;
  box.innerHTML = top.map(a =>
    '<div class="adm-list-item"><div class="adm-feed-ico ' + a.cls + '">' + a.ico + '</div>' +
    '<div class="adm-list-main"><div class="adm-list-name">' + a.title + '</div><div class="adm-list-meta">' + admEsc(a.meta) + '</div></div>' +
    '<div class="adm-list-val" style="color:var(--text3);font-weight:600;font-size:12px;">' + timeAgo(a.t) + '</div></div>'
  ).join('');
}

function timeAgo(d) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return '방금';
  if (s < 3600) return Math.floor(s / 60) + '분 전';
  if (s < 86400) return Math.floor(s / 3600) + '시간 전';
  return Math.floor(s / 86400) + '일 전';
}

// ══════════ 전환 검수 큐 ══════════
let __admConvs = [];
let __rvFilter = 'pending';
async function loadReview() {
  if (!window.opClient) return;
  const tb = document.querySelector('#review-table tbody');
  const { data, error } = await window.opClient.from('conversions')
    .select('id,order_amount,commission_amount,status,created_at,order_type,partner_id,partners(name,nickname),partner_links(title)')
    .order('created_at', { ascending: false });
  if (error) { if (tb) tb.innerHTML = '<tr><td colspan="7"><div class="adm-empty">' + admEsc(error.message) + '</div></td></tr>'; return; }
  __admConvs = data || [];
  const pending = __admConvs.filter(c => c.status === 'pending');
  const now = new Date();
  const confirmedThisMonth = __admConvs.filter(c => { const d = new Date(c.created_at); return c.status === 'confirmed' && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); });
  setTxt('rv-pending-cnt', pending.length.toLocaleString());
  setTxt('rv-pending-sum', '₩' + Math.round(pending.reduce((s, c) => s + Number(c.commission_amount || 0), 0)).toLocaleString());
  setTxt('rv-confirmed-cnt', confirmedThisMonth.length.toLocaleString());
  const badge = document.getElementById('nav-review-badge');
  if (badge) { badge.textContent = pending.length; badge.style.display = pending.length ? '' : 'none'; }
  renderReview();
}
function renderReview() {
  const tb = document.querySelector('#review-table tbody');
  if (!tb) return;
  const list = __rvFilter === 'all' ? __admConvs : __admConvs.filter(c => c.status === __rvFilter);
  if (!list.length) { tb.innerHTML = '<tr><td colspan="7"><div class="adm-empty"><div class="ico">✅</div><b>해당하는 전환이 없어요</b></div></td></tr>'; return; }
  tb.innerHTML = list.map(c => {
    const pname = (c.partners && (c.partners.name || c.partners.nickname)) || '-';
    const prod = (c.partner_links && c.partner_links.title) || '(상품 미상)';
    return '<tr>' +
      '<td><b>' + admEsc(pname) + '</b></td>' +
      '<td style="font-size:13px;color:var(--text2);">' + admEsc(prod) + '</td>' +
      '<td>₩' + Math.round(Number(c.order_amount || 0)).toLocaleString() + '</td>' +
      '<td style="color:var(--lime);font-weight:700;">₩' + Math.round(Number(c.commission_amount || 0)).toLocaleString() + '</td>' +
      '<td style="font-size:12px;color:var(--text3);">' + admEsc(String(c.created_at || '').slice(0, 10)) + '</td>' +
      '<td>' + reviewStatusPill(c.status) + '</td>' +
      '<td style="text-align:right;white-space:nowrap;">' + (c.status === 'pending'
        ? '<button class="admin-action-btn approve" onclick="reviewConv(\'' + admEsc(c.id) + '\',\'confirmed\',this)">확정</button> ' +
          '<button class="admin-action-btn reject" onclick="reviewConv(\'' + admEsc(c.id) + '\',\'canceled\',this)">취소</button>'
        : (c.status === 'confirmed'
          ? '<button class="admin-action-btn reject" onclick="reviewConv(\'' + admEsc(c.id) + '\',\'canceled\',this)">취소로 변경</button>'
          : '<span style="font-size:12px;color:var(--text3);">—</span>')) +
      '</td></tr>';
  }).join('');
}
function reviewStatusPill(s) {
  if (s === 'confirmed') return '<span class="status-pill confirmed">확정</span>';
  if (s === 'canceled') return '<span class="status-pill paused">취소</span>';
  if (s === 'settled') return '<span class="status-pill active">정산완료</span>';
  return '<span class="status-pill pending">대기</span>';
}
async function reviewConv(id, status, btn) {
  if (!window.opClient) return;
  if (status === 'canceled' && !confirm('이 전환을 취소 처리할까요? (반품·오류 주문)')) return;
  btn.disabled = true; const t = btn.textContent; btn.textContent = '처리 중...';
  const { error } = await window.opClient.from('conversions').update({ status }).eq('id', id);
  if (error) { btn.disabled = false; btn.textContent = t; showToast('실패: ' + error.message); return; }
  const c = __admConvs.find(x => x.id === id); if (c) c.status = status;
  loadReview();
  showToast(status === 'confirmed' ? '전환 확정 ✅' : '전환 취소 처리됨');
}
document.getElementById('rv-filters')?.addEventListener('click', e => {
  const btn = e.target.closest('.admin-filter-btn'); if (!btn) return;
  document.querySelectorAll('#rv-filters .admin-filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  __rvFilter = btn.dataset.status;
  renderReview();
});

// ══════════ 정산 처리 (확정 전환 → 파트너별 지급) ══════════
async function loadSettle() {
  if (!window.opClient) return;
  const tb = document.querySelector('#settle-table tbody');
  setTxt('settle-period', '· ' + new Date().toISOString().slice(0, 7) + ' 기준');
  const { data, error } = await window.opClient.from('conversions')
    .select('id,commission_amount,status,partner_id,partners(name,nickname,bank_name,bank_account,bank_holder,tax_type)')
    .eq('status', 'confirmed');
  if (error) { if (tb) tb.innerHTML = '<tr><td colspan="7"><div class="adm-empty">' + admEsc(error.message) + '</div></td></tr>'; return; }
  const groups = {};
  (data || []).forEach(c => {
    const pid = c.partner_id;
    if (!groups[pid]) groups[pid] = { pid, p: c.partners || {}, cnt: 0, sum: 0, ids: [] };
    groups[pid].cnt++; groups[pid].sum += Number(c.commission_amount || 0); groups[pid].ids.push(c.id);
  });
  const list = Object.values(groups).sort((a, b) => b.sum - a.sum);
  if (!tb) return;
  if (!list.length) { tb.innerHTML = '<tr><td colspan="7"><div class="adm-empty"><div class="ico">💸</div><b>정산할 확정 전환이 없어요</b>전환 검수에서 확정하면 여기 나타납니다</div></td></tr>'; return; }
  tb.innerHTML = list.map(g => {
    const hasBank = g.p.bank_name && g.p.bank_account;
    const bank = hasBank ? (admEsc(g.p.bank_name) + ' ' + admEsc(g.p.bank_account) + '<br><span style="font-size:11px;color:var(--text3);">' + admEsc(g.p.bank_holder || '') + '</span>') : '<span style="color:#FF4D6A;font-size:12px;">계좌 미등록</span>';
    const isBiz = g.p.tax_type === 'business';
    const wh = isBiz ? 0 : Math.round(g.sum * 0.033);
    const net = Math.round(g.sum) - wh;
    const taxCell = isBiz
      ? '<span style="color:var(--text3);font-size:12px;">사업자<br>(세금계산서)</span>'
      : '<span style="color:#FF4D6A;font-size:13px;">-₩' + wh.toLocaleString() + '</span><br><span style="font-size:11px;color:var(--text3);">3.3%</span>';
    return '<tr>' +
      '<td><b>' + admEsc(g.p.name || g.p.nickname || '-') + '</b></td>' +
      '<td>' + g.cnt + '건</td>' +
      '<td style="font-weight:700;">₩' + Math.round(g.sum).toLocaleString() + '</td>' +
      '<td>' + taxCell + '</td>' +
      '<td style="color:var(--lime);font-weight:800;font-size:15px;">₩' + net.toLocaleString() + '</td>' +
      '<td style="font-size:12px;">' + bank + '</td>' +
      '<td style="text-align:right;"><button class="comm-save" ' + (hasBank ? '' : 'disabled style="opacity:.4;cursor:not-allowed;"') + ' onclick="paySettle(\'' + admEsc(g.pid) + '\',this)">지급 처리</button></td>' +
      '</tr>';
  }).join('');
  // 캐시(지급 시 사용)
  window.__settleGroups = groups;
}
async function paySettle(pid, btn) {
  if (!window.opClient) return;
  const g = window.__settleGroups && window.__settleGroups[pid];
  if (!g) return;
  if (!confirm(g.p.name + '님에게 ₩' + Math.round(g.sum).toLocaleString() + ' 정산 지급 처리할까요?\n(' + g.cnt + '건의 전환이 정산 완료됩니다)')) return;
  btn.disabled = true; btn.textContent = '처리 중...';
  const period = new Date().toISOString().slice(0, 7);
  const bankSnap = (g.p.bank_name || '') + ' ' + (g.p.bank_account || '') + ' (' + (g.p.bank_holder || '') + ')';
  const nowIso = new Date().toISOString();
  // 1) settlement upsert (같은 달 재지급 시 누적)
  const { data: existing } = await window.opClient.from('settlements').select('id,total_amount').eq('partner_id', pid).eq('period', period).maybeSingle();
  let sErr;
  if (existing) {
    ({ error: sErr } = await window.opClient.from('settlements').update({ total_amount: Number(existing.total_amount) + g.sum, status: 'paid', bank_snapshot: bankSnap, paid_at: nowIso }).eq('id', existing.id));
  } else {
    ({ error: sErr } = await window.opClient.from('settlements').insert({ partner_id: pid, period, total_amount: g.sum, status: 'paid', bank_snapshot: bankSnap, paid_at: nowIso }));
  }
  if (sErr) { btn.disabled = false; btn.textContent = '지급 처리'; showToast('정산 저장 실패: ' + sErr.message); return; }
  // 2) 해당 전환 settled
  const { error: cErr } = await window.opClient.from('conversions').update({ status: 'settled' }).in('id', g.ids);
  if (cErr) { showToast('전환 상태 갱신 실패: ' + cErr.message); }
  showToast(g.p.name + '님 정산 완료 ✅');
  loadSettle();
}

// ══════════ 정산 내역 ══════════
let __admSettlements = [];
async function loadSettleHistory() {
  if (!window.opClient) return;
  const tb = document.querySelector('#settle-history-table tbody');
  const { data, error } = await window.opClient.from('settlements')
    .select('period,total_amount,status,paid_at,partners(name,nickname)')
    .order('period', { ascending: false }).order('created_at', { ascending: false });
  if (error) { if (tb) tb.innerHTML = '<tr><td colspan="5"><div class="adm-empty">' + admEsc(error.message) + '</div></td></tr>'; return; }
  __admSettlements = data || [];
  renderSettleHistory(__admSettlements);
}
function renderSettleHistory(list) {
  const tb = document.querySelector('#settle-history-table tbody');
  if (!tb) return;
  if (!list.length) { tb.innerHTML = '<tr><td colspan="5"><div class="adm-empty"><div class="ico">🏦</div><b>정산 내역이 없어요</b>정산을 처리하면 여기에 기록됩니다</div></td></tr>'; return; }
  tb.innerHTML = list.map(s => {
    const pname = (s.partners && (s.partners.name || s.partners.nickname)) || '-';
    return '<tr>' +
      '<td><b>' + admEsc(s.period) + '</b></td>' +
      '<td>' + admEsc(pname) + '</td>' +
      '<td style="color:var(--lime);font-weight:700;">₩' + Math.round(Number(s.total_amount || 0)).toLocaleString() + '</td>' +
      '<td>' + (s.status === 'paid' ? '<span class="status-pill active">지급완료</span>' : '<span class="status-pill pending">대기</span>') + '</td>' +
      '<td style="font-size:12px;color:var(--text3);">' + admEsc(s.paid_at ? String(s.paid_at).slice(0, 10) : '-') + '</td>' +
      '</tr>';
  }).join('');
}
document.getElementById('settle-hist-search')?.addEventListener('input', function () {
  const q = this.value.toLowerCase();
  renderSettleHistory(__admSettlements.filter(s => (String(s.period) + ((s.partners && s.partners.name) || '')).toLowerCase().includes(q)));
});

function setTxt(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

// ══════════ 부정 클릭 탐지 ══════════
async function loadFraud() {
  if (!window.opClient) return;
  const tb = document.querySelector('#fraud-table tbody');
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const [clRes, plRes, pRes, cvRes] = await Promise.all([
    window.opClient.from('link_clicks').select('ip_hash,link_id').gte('clicked_at', since).limit(5000),
    window.opClient.from('partner_links').select('id,partner_id'),
    window.opClient.from('partners').select('id,name,nickname'),
    window.opClient.from('conversions').select('partner_id,status')
  ]);
  if (clRes.error) { if (tb) tb.innerHTML = '<tr><td colspan="7"><div class="adm-empty">' + admEsc(clRes.error.message) + '</div></td></tr>'; return; }
  const linkToPartner = {}; (plRes.data || []).forEach(l => linkToPartner[l.id] = l.partner_id);
  const pName = {}; (pRes.data || []).forEach(p => pName[p.id] = p.name || p.nickname || '-');
  const convCnt = {}; (cvRes.data || []).forEach(c => { if (c.status !== 'canceled') convCnt[c.partner_id] = (convCnt[c.partner_id] || 0) + 1; });
  const agg = {};
  (clRes.data || []).forEach(cl => {
    const pid = linkToPartner[cl.link_id]; if (!pid) return;
    if (!agg[pid]) agg[pid] = { pid, clicks: 0, ip: {} };
    agg[pid].clicks++;
    const ip = cl.ip_hash || '(none)';
    agg[pid].ip[ip] = (agg[pid].ip[ip] || 0) + 1;
  });
  let totalClicks = 0, suspectClicks = 0, flagged = 0;
  const rank = { danger: 2, warn: 1, ok: 0 };
  const rows = Object.values(agg).map(a => {
    const uniqIp = Object.keys(a.ip).length;
    const maxRep = Math.max(0, ...Object.values(a.ip));
    const conv = convCnt[a.pid] || 0;
    const cvr = a.clicks ? conv / a.clicks : 0;
    const dupClicks = Math.max(0, a.clicks - uniqIp);
    totalClicks += a.clicks; suspectClicks += dupClicks;
    const uniqRatio = a.clicks ? uniqIp / a.clicks : 1;
    let risk = 'ok';
    if (a.clicks >= 10 && (uniqRatio < 0.3 || maxRep >= a.clicks * 0.6)) risk = 'danger';
    else if (a.clicks >= 5 && (uniqRatio < 0.5 || (cvr === 0 && a.clicks >= 20))) risk = 'warn';
    if (risk !== 'ok') flagged++;
    return { pid, clicks: a.clicks, uniqIp, maxRep, conv, cvr, risk };
  }).sort((x, y) => (rank[y.risk] - rank[x.risk]) || (y.clicks - x.clicks));
  setTxt('fr-total', totalClicks.toLocaleString());
  setTxt('fr-suspect', suspectClicks.toLocaleString());
  setTxt('fr-flagged', flagged.toLocaleString());
  const badge = document.getElementById('nav-fraud-badge');
  if (badge) { badge.textContent = flagged; badge.style.display = flagged ? '' : 'none'; }
  if (!tb) return;
  if (!rows.length) { tb.innerHTML = '<tr><td colspan="7"><div class="adm-empty"><div class="ico">🚨</div><b>클릭 데이터가 없어요</b>링크 클릭이 쌓이면 자동 분석됩니다</div></td></tr>'; return; }
  tb.innerHTML = rows.map(r => {
    const pill = r.risk === 'danger' ? '<span class="status-pill paused">🔴 위험</span>' : r.risk === 'warn' ? '<span class="status-pill pending">🟡 주의</span>' : '<span class="status-pill active">🟢 정상</span>';
    const repHot = (r.maxRep >= r.clicks * 0.6 && r.clicks >= 10);
    return '<tr>' +
      '<td><b>' + admEsc(pName[r.pid] || '-') + '</b></td>' +
      '<td>' + r.clicks.toLocaleString() + '</td>' +
      '<td>' + r.uniqIp.toLocaleString() + '</td>' +
      '<td' + (repHot ? ' style="color:#FF4D6A;font-weight:700;"' : '') + '>' + r.maxRep + '회</td>' +
      '<td>' + r.conv + '</td>' +
      '<td>' + (r.cvr * 100).toFixed(1) + '%</td>' +
      '<td>' + pill + '</td></tr>';
  }).join('');
}

// ══════════ 시즌 캠페인 CRUD ══════════
let __campaigns = [];
async function loadCampaigns() {
  if (!window.opClient) return;
  const box = document.getElementById('campaign-list');
  const { data, error } = await window.opClient.from('campaigns').select('*').order('starts_at', { ascending: false });
  if (error) { if (box) box.innerHTML = '<div class="adm-empty"><div class="ico">⚠️</div><b>캠페인을 불러오지 못했어요</b>' + admEsc(error.message) + '</div>'; return; }
  __campaigns = data || [];
  renderCampaigns();
}
function campStatus(c) {
  const today = new Date().toISOString().slice(0, 10);
  if (c.starts_at > today) return 'scheduled';
  if (c.ends_at < today) return 'ended';
  return 'live';
}
function fmtRate(r) { return (Number(r) * 100).toFixed(1).replace(/\.0$/, ''); }
function renderCampaigns() {
  const box = document.getElementById('campaign-list');
  if (!box) return;
  if (!__campaigns.length) { box.innerHTML = '<div class="adm-empty"><div class="ico">🎁</div><b>등록된 캠페인이 없어요</b>+ 새 캠페인으로 시즌 프로모션을 만들어보세요</div>'; return; }
  box.innerHTML = __campaigns.map(c => {
    const st = campStatus(c);
    const stPill = !c.is_active ? '<span class="camp-status ended">비활성</span>'
      : st === 'scheduled' ? '<span class="camp-status scheduled">예정</span>'
      : st === 'ended' ? '<span class="camp-status ended">종료</span>'
      : '<span class="camp-status live">진행중</span>';
    const tgt = c.target_type === 'category' ? ('🎯 ' + admEsc(c.target_value || '카테고리')) : c.target_type === 'product' ? '🎯 특정 상품' : '🛒 전체 상품';
    return '<div class="campaign-card' + (c.is_active ? '' : ' inactive') + '">' +
      '<div class="camp-head"><span class="camp-emoji">' + admEsc(c.emoji || '🎁') + '</span><span class="camp-bonus-badge">+' + fmtRate(c.bonus_rate) + '%</span></div>' +
      '<div class="camp-title">' + admEsc(c.title) + '</div>' +
      '<div class="camp-desc">' + admEsc(c.description || '') + '</div>' +
      '<div class="camp-meta">📅 ' + admEsc(c.starts_at) + ' ~ ' + admEsc(c.ends_at) + '<br>' + tgt + '</div>' +
      '<div class="camp-footer">' + stPill + '<div class="camp-actions">' +
        '<button class="camp-icon-btn" title="' + (c.is_active ? '비활성화' : '활성화') + '" onclick="toggleCampaign(\'' + c.id + '\',' + (!c.is_active) + ')">' + (c.is_active ? '⏸' : '▶') + '</button>' +
        '<button class="camp-icon-btn" title="수정" onclick="openCampaignModal(\'' + c.id + '\')">✏️</button>' +
        '<button class="camp-icon-btn del" title="삭제" onclick="deleteCampaign(\'' + c.id + '\')">🗑</button>' +
      '</div></div></div>';
  }).join('');
}
function onCampTargetChange() {
  const t = document.getElementById('cm-target-type').value;
  document.getElementById('cm-target-value-wrap').style.display = t === 'category' ? '' : 'none';
}
function openCampaignModal(id) {
  const c = id ? __campaigns.find(x => x.id === id) : null;
  document.getElementById('cm-title').textContent = c ? '캠페인 수정' : '새 캠페인';
  document.getElementById('cm-id').value = c ? c.id : '';
  document.getElementById('cm-emoji').value = c ? (c.emoji || '🎁') : '🎁';
  document.getElementById('cm-title-input').value = c ? c.title : '';
  document.getElementById('cm-desc').value = c ? (c.description || '') : '';
  document.getElementById('cm-target-type').value = c ? c.target_type : 'all';
  document.getElementById('cm-target-value').value = c ? (c.target_value || '') : '';
  document.getElementById('cm-bonus').value = c ? Number(c.bonus_rate) * 100 : 3;
  document.getElementById('cm-start').value = c ? c.starts_at : '';
  document.getElementById('cm-end').value = c ? c.ends_at : '';
  document.getElementById('cm-active').checked = c ? c.is_active : true;
  onCampTargetChange();
  openModal('campaign-modal');
}
async function saveCampaign(btn) {
  if (!window.opClient) return;
  const id = document.getElementById('cm-id').value;
  const title = document.getElementById('cm-title-input').value.trim();
  const starts = document.getElementById('cm-start').value;
  const ends = document.getElementById('cm-end').value;
  if (!title) { alert('제목을 입력하세요'); return; }
  if (!starts || !ends) { alert('시작일과 종료일을 입력하세요'); return; }
  if (ends < starts) { alert('종료일이 시작일보다 빠릅니다'); return; }
  const tt = document.getElementById('cm-target-type').value;
  const payload = {
    title,
    description: document.getElementById('cm-desc').value.trim() || null,
    emoji: document.getElementById('cm-emoji').value || '🎁',
    target_type: tt,
    target_value: tt === 'category' ? (document.getElementById('cm-target-value').value.trim() || null) : null,
    bonus_rate: (Number(document.getElementById('cm-bonus').value) || 0) / 100,
    starts_at: starts, ends_at: ends,
    is_active: document.getElementById('cm-active').checked
  };
  btn.disabled = true; const t = btn.textContent; btn.textContent = '저장 중...';
  let error;
  if (id) { ({ error } = await window.opClient.from('campaigns').update(payload).eq('id', id)); }
  else { ({ error } = await window.opClient.from('campaigns').insert(payload)); }
  btn.disabled = false; btn.textContent = t;
  if (error) { alert('저장 실패: ' + error.message); return; }
  closeModal('campaign-modal'); showToast('캠페인 저장 완료 ✅'); loadCampaigns();
}
async function toggleCampaign(id, active) {
  if (!window.opClient) return;
  const { error } = await window.opClient.from('campaigns').update({ is_active: active }).eq('id', id);
  if (error) { showToast('실패: ' + error.message); return; }
  loadCampaigns(); showToast(active ? '캠페인 활성화 ✅' : '캠페인 비활성화');
}
async function deleteCampaign(id) {
  if (!window.opClient) return;
  if (!confirm('이 캠페인을 삭제할까요?')) return;
  const { error } = await window.opClient.from('campaigns').delete().eq('id', id);
  if (error) { showToast('실패: ' + error.message); return; }
  loadCampaigns(); showToast('캠페인 삭제됨');
}

// 초기 진입 시 오버뷰 로드
document.addEventListener('DOMContentLoaded', () => { setTimeout(loadAdminOverview, 300); });
