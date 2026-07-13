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
  if (pageId === 'partners') loadAdminPartners();
  if (pageId === 'overview') loadAdminOverview();
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

// ── 파트너 승인/거절
function approvePartner(btn) {
  const row = btn.closest('tr');
  const statusCell = row.querySelector('.status-cell');
  if (statusCell) statusCell.innerHTML = '<span class="status-active">활성</span>';
  btn.closest('.action-btns').innerHTML = '<span style="font-size:12px;color:rgba(255,255,255,0.3);">처리완료</span>';
}
function rejectPartner(btn) {
  const row = btn.closest('tr');
  const statusCell = row.querySelector('.status-cell');
  if (statusCell) statusCell.innerHTML = '<span class="status-rejected">거절</span>';
  btn.closest('.action-btns').innerHTML = '<span style="font-size:12px;color:rgba(255,255,255,0.3);">처리완료</span>';
}

// ── 쇼핑몰 승인/거절
function approveShop(btn) {
  const row = btn.closest('tr');
  const statusCell = row.querySelector('.status-cell');
  if (statusCell) statusCell.innerHTML = '<span class="status-active">승인</span>';
  btn.closest('.action-btns').innerHTML = '<span style="font-size:12px;color:rgba(255,255,255,0.3);">처리완료</span>';
}
function rejectShop(btn) {
  const row = btn.closest('tr');
  const statusCell = row.querySelector('.status-cell');
  if (statusCell) statusCell.innerHTML = '<span class="status-rejected">거절</span>';
  btn.closest('.action-btns').innerHTML = '<span style="font-size:12px;color:rgba(255,255,255,0.3);">처리완료</span>';
}

// ── 정산 처리 모달 열기
function openSettleModal(name, amount, method) {
  document.getElementById('settle-name').textContent = name;
  document.getElementById('settle-amount').textContent = amount;
  document.getElementById('settle-method').textContent = method;
  openModal('settle-modal');
}

function confirmSettle() {
  const note = document.getElementById('settle-note').value;
  closeModal('settle-modal');
  showToast('정산 처리 완료 ✅');
}

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

// ── SVG 통계 차트 (관리자 오버뷰)
function drawAdminChart() {
  const svg = document.getElementById('admin-chart');
  if (!svg) return;

  const data = [420, 580, 510, 790, 860, 740, 1020, 980, 1150, 1080, 1340, 1520];
  const labels = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  const W = 680, H = 140, PAD = { top: 10, right: 10, bottom: 24, left: 10 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;
  const max = Math.max(...data);
  const min = Math.min(...data) * 0.85;

  const pts = data.map((v, i) => ({
    x: PAD.left + (i / (data.length - 1)) * cW,
    y: PAD.top + (1 - (v - min) / (max - min)) * cH,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaD = pathD + ` L${pts[pts.length-1].x.toFixed(1)},${(PAD.top+cH).toFixed(1)} L${PAD.left},${(PAD.top+cH).toFixed(1)} Z`;

  svg.querySelector('.ac-area')?.setAttribute('d', areaD);
  svg.querySelector('.ac-line')?.setAttribute('d', pathD);

  const dotsG = svg.querySelector('.ac-dots');
  if (dotsG) {
    dotsG.innerHTML = pts.map((p, i) =>
      `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i === pts.length-1 ? 5 : 3}"
        fill="${i === pts.length-1 ? '#BEFF00' : '#141414'}" stroke="#BEFF00" stroke-width="1.5"/>`
    ).join('');
  }

  const labelsG = svg.querySelector('.ac-labels');
  if (labelsG) {
    labelsG.innerHTML = labels.map((l, i) => {
      const x = PAD.left + (i / (labels.length - 1)) * cW;
      return `<text x="${x.toFixed(1)}" y="${H}" text-anchor="middle" fill="rgba(255,255,255,0.22)" font-size="10" font-family="inherit">${l}</text>`;
    }).join('');
  }
}

// ── 초기화
document.addEventListener('DOMContentLoaded', () => {
  showAdminPage('overview');
  drawAdminChart();
});

// ══════════ 실데이터 연동 ══════════
function admEsc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

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
async function loadAdminPartners() {
  const tb = document.querySelector('#ap-partners table tbody');
  const titleEl = document.querySelector('#ap-partners .admin-table-title');
  if (!window.opClient) return;
  const { data, error } = await window.opClient.from('partners').select('name,nickname,email,channels,status,created_at').order('created_at', { ascending: false });
  if (error) { if (tb) tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text3);">' + admEsc(error.message) + '</td></tr>'; return; }
  if (titleEl) titleEl.textContent = '파트너 목록 (' + data.length + ')';
  if (!tb) return;
  if (!data.length) { tb.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:48px;color:var(--text3);">아직 가입한 파트너가 없어요.</td></tr>'; return; }
  tb.innerHTML = data.map(p => '<tr>' +
    '<td><b>' + admEsc(p.name || '-') + '</b>' + (p.nickname ? ' <span style="color:var(--text3);font-size:12px;">@' + admEsc(p.nickname) + '</span>' : '') + '</td>' +
    '<td style="color:var(--text2);font-size:13px;">' + admEsc(p.email || '') + '</td>' +
    '<td style="font-size:12px;color:var(--text3);">' + admEsc((p.channels || []).join(', ')) + '</td>' +
    '<td>' + (p.status === 'suspended' ? '<span class="status-pill paused">정지</span>' : '<span class="status-pill active">● 활성</span>') + '</td>' +
    '<td style="font-size:12px;color:var(--text3);">' + admEsc(String(p.created_at || '').slice(0, 10)) + '</td>' +
    '</tr>').join('');
}

// ── 관리자 오버뷰 실집계
async function loadAdminOverview() {
  if (!window.opClient) return;
  const [pRes, lRes, cRes] = await Promise.all([
    window.opClient.from('partners').select('id', { count: 'exact', head: true }),
    window.opClient.from('partner_links').select('id', { count: 'exact', head: true }),
    window.opClient.from('conversions').select('commission_amount,status')
  ]);
  const convs = cRes.data || [];
  const revenue = convs.filter(c => c.status !== 'canceled').reduce((s, c) => s + Number(c.commission_amount || 0), 0);
  const cards = document.querySelectorAll('#ap-overview .admin-card-value');
  if (cards[0]) cards[0].textContent = (pRes.count || 0).toLocaleString();
  if (cards[1]) cards[1].textContent = (lRes.count || 0).toLocaleString();
  if (cards[2]) cards[2].textContent = '₩' + Math.round(convs.reduce((s, c) => s + Number(c.commission_amount || 0), 0)).toLocaleString();
  if (cards[3]) cards[3].textContent = '₩' + Math.round(revenue).toLocaleString();
}

// 초기 진입 시 오버뷰 로드
document.addEventListener('DOMContentLoaded', () => { setTimeout(loadAdminOverview, 300); });
