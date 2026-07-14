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
  if (pageId === 'ads') loadAdsAdmin();
  if (pageId === 'partners') loadAdminPartners();
  if (pageId === 'notice') loadNoticeCenter();
  if (pageId === 'overview') loadAdminOverview();
  if (pageId === 'review') loadReview();
  if (pageId === 'settle') loadSettle();
  if (pageId === 'settle-history') loadSettleHistory();
  if (pageId === 'fraud') loadFraud();
  if (pageId === 'audit') loadAuditLog();
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

async function createPartnerNotification(partnerId, type, title, body) {
  if (!window.opClient || !partnerId) return;
  try {
    const { error } = await window.opClient.from('notifications').insert({
      partner_id: partnerId,
      type,
      title,
      body
    });
    if (error) console.warn('notification insert failed:', error.message);
  } catch (err) {
    console.warn('notification insert failed:', err);
  }
}

// ── 초기화
document.addEventListener('DOMContentLoaded', () => {
  showAdminPage('overview');
});

// ══════════ 실데이터 연동 ══════════
function admEsc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function admMoney(v) { return '₩' + Math.round(Number(v || 0)).toLocaleString(); }
function admDate(v) { return v ? String(v).slice(0, 10) : '-'; }
function admArrText(v) { return Array.isArray(v) ? v.join(', ') : (v || ''); }
function maskResidentNo(v) {
  const digits = String(v || '').replace(/\D/g, '');
  if (!digits) return '-';
  return digits.charAt(0) + '**-***';
}
function taxTypeLabel(v) { return v === 'business' ? '사업자' : '개인'; }
async function logAdminAction(action, targetType, targetId, detail) {
  if (!window.opClient) return;
  try {
    const { data: { user } } = await window.opClient.auth.getUser();
    const { error } = await window.opClient.from('admin_audit_log').insert({
      admin_id: user?.id || null,
      action,
      target_type: targetType,
      target_id: targetId == null ? null : String(targetId),
      detail: detail || {}
    });
    if (error) console.warn('admin audit log failed:', error.message);
  } catch (err) {
    console.warn('admin audit log failed:', err);
  }
}

// ── 상품 마진 설정
let __admProducts = [];
let __admCategories = [];
let __admCommCategory = 'all';
let __admCommVisible = 15;
const ADM_COMM_PAGE_SIZE = 15;
async function loadCommissions() {
  const box = document.getElementById('comm-list');
  if (!box || !window.opClient) return;
  const [pRes, cRes, catRes] = await Promise.all([
    window.opClient.from('products').select('id,name,retail_price,image_url,is_active,category_id').order('created_at', { ascending: false }),
    window.opClient.from('product_commissions').select('product_id,commission_rate'),
    window.opClient.from('categories').select('id,name,sort_order').order('sort_order', { ascending: true })
  ]);
  if (pRes.error) { box.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text3);">상품을 불러오지 못했어요: ' + admEsc(pRes.error.message) + '</div>'; return; }
  const rateMap = {};
  (cRes.data || []).forEach(c => { rateMap[c.product_id] = Math.round(Number(c.commission_rate) * 100); });
  const categoryMap = {};
  __admCategories = catRes.error ? [] : (catRes.data || []);
  __admCategories.forEach(c => { categoryMap[String(c.id)] = c.name; });
  __admProducts = (pRes.data || []).map(p => Object.assign({}, p, {
    rate: (rateMap[p.id] != null ? rateMap[p.id] : 5),
    categoryName: categoryMap[String(p.category_id)] || ''
  }));
  renderCommissionFilters();
  renderCommissions();
}
function getFilteredCommissions() {
  const searchEl = document.getElementById('comm-search');
  const q = (searchEl?.value || '').trim().toLowerCase();
  return __admProducts.filter(function (p) {
    const matchesCategory = __admCommCategory === 'all' || String(p.category_id || '') === __admCommCategory;
    const matchesSearch = !q || (p.name || '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });
}
function renderCommissionFilters() {
  const wrap = document.getElementById('comm-category-filters');
  if (!wrap) return;
  const used = {};
  __admProducts.forEach(p => { if (p.category_id) used[String(p.category_id)] = true; });
  const cats = __admCategories.filter(c => used[String(c.id)]);
  if (__admCommCategory !== 'all' && !used[__admCommCategory]) __admCommCategory = 'all';
  wrap.innerHTML = '<button class="admin-filter-btn' + (__admCommCategory === 'all' ? ' active' : '') + '" type="button" data-comm-category="all">전체</button>' +
    cats.map(c => '<button class="admin-filter-btn' + (__admCommCategory === String(c.id) ? ' active' : '') + '" type="button" data-comm-category="' + admEsc(c.id) + '">' + admEsc(c.name) + '</button>').join('');
}
function renderCommissions() {
  const box = document.getElementById('comm-list');
  if (!box) return;
  const list = getFilteredCommissions();
  const visibleList = list.slice(0, __admCommVisible);
  if (!list.length) {
    box.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text3);">상품이 없어요.</div>';
    updateCommissionMore(list.length);
    return;
  }
  box.innerHTML = visibleList.map(p => {
    const price = Number(p.retail_price) || 0;
    const img = (p.image_url && /^https?:\/\//.test(p.image_url) && p.image_url.length > 30) ? p.image_url : '';
    const earn = Math.round(price * p.rate / 100);
    return '<div class="comm-row" data-id="' + admEsc(p.id) + '">' +
      '<div class="comm-thumb" style="' + (img ? "background-image:url('" + admEsc(img) + "')" : '') + '">' + (img ? '' : '🛒') + '</div>' +
      '<div class="comm-info"><div class="comm-name">' + admEsc(p.name) + (p.is_active ? '' : ' <span style="color:var(--text3);font-size:11px;">(비활성)</span>') + '</div>' +
        '<div class="comm-price">' + (p.categoryName ? admEsc(p.categoryName) + ' · ' : '') + '판매가 ₩' + price.toLocaleString() + '</div></div>' +
      '<div class="comm-ctrl">' +
        '<input type="range" min="0" max="30" value="' + p.rate + '" class="comm-range" oninput="onCommRange(this)">' +
        '<div class="comm-rate-box"><input type="number" min="0" max="30" step="0.5" value="' + p.rate + '" class="comm-rate-input" oninput="onCommInput(this)">%</div>' +
        '<div class="comm-earn">수수료 ₩<span class="comm-earn-val">' + earn.toLocaleString() + '</span></div>' +
        '<button class="comm-save" onclick="saveCommission(this,\'' + admEsc(p.id) + '\')">저장</button>' +
      '</div></div>';
  }).join('');
  updateCommissionMore(list.length);
}
function updateCommissionMore(total) {
  const btn = document.getElementById('comm-more');
  if (!btn) return;
  const remains = Math.max(total - __admCommVisible, 0);
  btn.style.display = remains > 0 ? 'inline-flex' : 'none';
  btn.textContent = remains > 0 ? '더 보기 (' + remains.toLocaleString() + ')' : '더 보기';
}
// 공통: 행의 rate로 미리보기·저장버튼 갱신
function commApply(row, rate) {
  const p = __admProducts.find(x => x.id === row.dataset.id);
  const price = p ? (Number(p.retail_price) || 0) : 0;
  row.querySelector('.comm-earn-val').textContent = Math.round(price * rate / 100).toLocaleString();
  row.querySelector('.comm-save').classList.add('dirty');
}
// 슬라이더 드래그 → 입력칸 동기화
function onCommRange(el) {
  const row = el.closest('.comm-row');
  const rate = Number(el.value);
  const input = row.querySelector('.comm-rate-input');
  if (input) input.value = rate;
  commApply(row, rate);
}
// 숫자 입력 → 슬라이더 동기화 (0~30 범위 제한)
function onCommInput(el) {
  const row = el.closest('.comm-row');
  let rate = parseFloat(el.value);
  if (isNaN(rate)) return;                 // 지우는 중엔 대기
  if (rate < 0) rate = 0;
  if (rate > 30) { rate = 30; el.value = 30; }
  const range = row.querySelector('.comm-range');
  if (range) range.value = rate;
  commApply(row, rate);
}
async function saveCommission(btn, pid) {
  if (!window.opClient) return;
  const row = btn.closest('.comm-row');
  const inputEl = row.querySelector('.comm-rate-input');
  let pct = parseFloat(inputEl ? inputEl.value : row.querySelector('.comm-range').value);
  if (isNaN(pct) || pct < 0) pct = 0;
  if (pct > 30) pct = 30;
  const rate = pct / 100;
  const t = btn.textContent; btn.disabled = true; btn.textContent = '저장 중...';
  const { data: { user } } = await window.opClient.auth.getUser();
  const { error } = await window.opClient.from('product_commissions')
    .upsert({ product_id: pid, commission_rate: rate, updated_by: user?.id, updated_at: new Date().toISOString() }, { onConflict: 'product_id' });
  btn.disabled = false;
  if (error) { btn.textContent = t; alert('저장 실패: ' + error.message); return; }
  await logAdminAction('save_commission', 'product_commission', pid, { product_id: pid, commission_rate: rate });
  btn.textContent = '✓ 저장됨'; btn.classList.remove('dirty');
  const p = __admProducts.find(x => x.id === pid); if (p) p.rate = Number(row.querySelector('.comm-range').value);
  setTimeout(() => { btn.textContent = '저장'; }, 1500);
}
document.getElementById('comm-search')?.addEventListener('input', function () {
  __admCommVisible = ADM_COMM_PAGE_SIZE;
  renderCommissions();
});
document.getElementById('comm-category-filters')?.addEventListener('click', function (e) {
  const btn = e.target.closest('[data-comm-category]');
  if (!btn) return;
  __admCommCategory = btn.dataset.commCategory || 'all';
  __admCommVisible = ADM_COMM_PAGE_SIZE;
  renderCommissionFilters();
  renderCommissions();
});
document.getElementById('comm-more')?.addEventListener('click', function () {
  __admCommVisible += ADM_COMM_PAGE_SIZE;
  renderCommissions();
});

// ── 파트너 목록
let __admPartners = [];
// 관리자 계정(판매 파트너 아님) — 파트너 목록에서 제외
const OP_ADMIN_EMAILS = ['s9653@naver.com'];
async function loadAdminPartners() {
  const tb = document.querySelector('#ap-partners table tbody');
  const titleEl = document.querySelector('#ap-partners .admin-table-title');
  if (!window.opClient) return;
  const { data, error } = await window.opClient.from('partners').select('id,name,nickname,email,channels,status,created_at').order('created_at', { ascending: false });
  if (error) { if (tb) tb.innerHTML = '<tr><td colspan="6"><div class="adm-empty">' + admEsc(error.message) + '</div></td></tr>'; return; }
  // 관리자 계정 제외
  __admPartners = (data || []).filter(p => !OP_ADMIN_EMAILS.includes((p.email || '').toLowerCase()));
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
      '<td style="text-align:right;">' +
        '<button class="admin-action-btn" onclick="openPartnerDetail(\'' + admEsc(p.id) + '\')">상세</button> ' +
        (suspended
          ? '<button class="admin-action-btn approve" onclick="setPartnerStatus(\'' + admEsc(p.id) + '\',\'active\',this)">활성화</button>'
          : '<button class="admin-action-btn reject" onclick="setPartnerStatus(\'' + admEsc(p.id) + '\',\'suspended\',this)">정지</button>') +
      '</td></tr>';
  }).join('');
}
function detailField(label, value) {
  return '<div class="partner-detail-field"><span>' + admEsc(label) + '</span><b>' + admEsc(value || '-') + '</b></div>';
}
function detailMetric(label, value) {
  return '<div class="partner-detail-metric"><span>' + admEsc(label) + '</span><b>' + admEsc(value) + '</b></div>';
}
function renderPartnerDetail(p, links, convs, settlements, clickCount) {
  const body = document.getElementById('pdm-body');
  const title = document.getElementById('pdm-title');
  if (!body) return;
  if (title) title.textContent = '파트너 상세 · ' + (p.name || p.nickname || '-');
  const confirmed = convs.filter(c => c.status === 'confirmed').length;
  const pending = convs.filter(c => c.status === 'pending').length;
  const canceled = convs.filter(c => c.status === 'canceled').length;
  const totalCommission = convs.filter(c => c.status !== 'canceled').reduce((s, c) => s + Number(c.commission_amount || 0), 0);
  const paidAmount = settlements.filter(s => s.status === 'paid').reduce((s, x) => s + Number(x.net_amount || x.total_amount || 0), 0);
  const recentRows = convs.slice(0, 5).map(c => {
    const prod = (c.partner_links && c.partner_links.title) || '-';
    return '<tr><td>' + admEsc(admDate(c.created_at)) + '</td><td>' + admEsc(prod) + '</td><td>' + admMoney(c.order_amount) + '</td><td style="color:var(--lime);font-weight:700;">' + admMoney(c.commission_amount) + '</td><td>' + reviewStatusPill(c.status) + '</td></tr>';
  }).join('');
  body.innerHTML =
    '<div class="partner-detail-grid">' +
      '<section class="partner-detail-section"><h4>프로필</h4>' +
        detailField('이름', p.name) + detailField('닉네임', p.nickname) + detailField('이메일', p.email) + detailField('전화', p.phone) +
        detailField('채널', admArrText(p.channels)) + detailField('카테고리', admArrText(p.categories)) + detailField('가입일', admDate(p.created_at)) + detailField('상태', p.status === 'suspended' ? '정지' : '활성') +
      '</section>' +
      '<section class="partner-detail-section"><h4>세금정보</h4>' +
        detailField('구분', taxTypeLabel(p.tax_type)) + detailField('주민번호', p.tax_type === 'business' ? '-' : maskResidentNo(p.resident_no)) +
        detailField('사업자번호', p.business_no) + detailField('상호', p.business_name) +
      '</section>' +
      '<section class="partner-detail-section"><h4>계좌</h4>' +
        detailField('은행', p.bank_name) + detailField('계좌', p.bank_account) + detailField('예금주', p.bank_holder) +
      '</section>' +
      '<section class="partner-detail-section"><h4>성과요약</h4><div class="partner-detail-metrics">' +
        detailMetric('총 링크수', links.length.toLocaleString()) + detailMetric('총 클릭', Number(clickCount || 0).toLocaleString()) +
        detailMetric('전환', '확정 ' + confirmed + ' · 대기 ' + pending + ' · 취소 ' + canceled) +
        detailMetric('총 수수료', admMoney(totalCommission)) + detailMetric('정산완료액', admMoney(paidAmount)) +
      '</div></section>' +
    '</div>' +
    '<section class="partner-detail-section partner-detail-recent"><h4>최근 전환 5건</h4>' +
      '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>발생일</th><th>상품</th><th>주문금액</th><th>수수료</th><th>상태</th></tr></thead><tbody>' +
        (recentRows || '<tr><td colspan="5"><div class="adm-empty"><b>전환 내역이 없어요</b></div></td></tr>') +
      '</tbody></table></div>' +
    '</section>';
}
async function openPartnerDetail(partnerId) {
  if (!window.opClient) return;
  const body = document.getElementById('pdm-body');
  if (body) body.innerHTML = '<div class="adm-empty"><div class="ico">👥</div><b>불러오는 중...</b></div>';
  openModal('partner-detail-modal');
  const [pRes, lRes, cRes, sRes] = await Promise.all([
    window.opClient.from('partners').select('id,name,nickname,email,phone,channels,categories,status,bank_name,bank_account,bank_holder,tax_type,resident_no,business_no,business_name,created_at').eq('id', partnerId).single(),
    window.opClient.from('partner_links').select('id').eq('partner_id', partnerId),
    window.opClient.from('conversions').select('id,status,commission_amount,order_amount,created_at,link_id,partner_id,partner_links(title)').eq('partner_id', partnerId).order('created_at', { ascending: false }),
    window.opClient.from('settlements').select('status,total_amount,net_amount').eq('partner_id', partnerId)
  ]);
  if (pRes.error) { if (body) body.innerHTML = '<div class="adm-empty"><b>파트너 정보를 불러오지 못했어요</b>' + admEsc(pRes.error.message) + '</div>'; return; }
  const links = lRes.data || [];
  let clickCount = 0;
  if (links.length) {
    const { count, error } = await window.opClient.from('link_clicks').select('id', { count: 'exact', head: true }).in('link_id', links.map(l => l.id));
    if (!error) clickCount = count || 0;
  }
  renderPartnerDetail(pRes.data, links, cRes.data || [], sRes.data || [], clickCount);
}
async function setPartnerStatus(id, status, btn) {
  if (!window.opClient) return;
  const label = status === 'suspended' ? '정지' : '활성화';
  if (status === 'suspended' && !confirm('이 파트너를 정지할까요?\n정지하면 로그인은 되지만 링크·수익 활동이 제한됩니다.')) return;
  btn.disabled = true; const t = btn.textContent; btn.textContent = '처리 중...';
  const { error } = await window.opClient.from('partners').update({ status }).eq('id', id);
  btn.disabled = false;
  if (error) { btn.textContent = t; showToast('실패: ' + error.message); return; }
  await logAdminAction('set_partner_status', 'partner', id, { status });
  const p = __admPartners.find(x => x.id === id); if (p) p.status = status;
  await createPartnerNotification(
    id,
    status === 'suspended' ? 'account_suspended' : 'account_activated',
    status === 'suspended' ? '계정이 정지됐어요' : '계정이 활성화됐어요',
    status === 'suspended'
      ? '관리자 확인으로 계정이 정지되었습니다. 링크 생성과 수익 활동이 제한됩니다.'
      : '계정이 다시 활성화되었습니다. 파트너 활동을 이어갈 수 있어요.'
  );
  renderAdminPartners(__admPartners);
  if (document.getElementById('ap-fraud')?.classList.contains('active')) loadFraud();
  showToast('파트너 ' + label + ' 완료 ✅');
}
document.getElementById('partner-search')?.addEventListener('input', function () {
  const q = this.value.toLowerCase();
  renderAdminPartners(__admPartners.filter(p => ((p.name || '') + (p.email || '') + (p.nickname || '')).toLowerCase().includes(q)));
});

// ── 공지 발송 센터
let __noticePartners = [];
async function loadNoticeCenter() {
  if (!window.opClient) return;
  await loadNoticePartners();
  await loadRecentNotices();
}
async function loadNoticePartners() {
  const sel = document.getElementById('notice-partner');
  const { data, error } = await window.opClient.from('partners')
    .select('id,name,nickname,email,status')
    .order('created_at', { ascending: false });
  if (error) {
    showToast('파트너 목록 로딩 실패: ' + error.message);
    return;
  }
  __noticePartners = (data || []).filter(p => !OP_ADMIN_EMAILS.includes((p.email || '').toLowerCase()));
  if (sel) {
    sel.innerHTML = '<option value="">파트너를 선택하세요</option>' + __noticePartners.map(p => {
      const label = (p.name || p.nickname || '이름 없음') + ' · ' + (p.email || '-') + (p.status === 'suspended' ? ' · 정지' : '');
      return '<option value="' + admEsc(p.id) + '">' + admEsc(label) + '</option>';
    }).join('');
  }
  updateNoticeTargetCount();
}
function onNoticeTargetChange() {
  const type = document.getElementById('notice-target-type')?.value || 'all';
  const wrap = document.getElementById('notice-partner-wrap');
  if (wrap) wrap.style.display = type === 'selected' ? '' : 'none';
  updateNoticeTargetCount();
}
function getNoticeTargetIds() {
  const type = document.getElementById('notice-target-type')?.value || 'all';
  if (type === 'selected') {
    const pid = document.getElementById('notice-partner')?.value || '';
    return pid ? [pid] : [];
  }
  return __noticePartners.map(p => p.id);
}
function updateNoticeTargetCount() {
  const el = document.getElementById('notice-target-count');
  if (!el) return;
  const type = document.getElementById('notice-target-type')?.value || 'all';
  const ids = getNoticeTargetIds();
  el.textContent = (type === 'selected' && !ids.length) ? '파트너를 선택하세요' : '대상 ' + ids.length.toLocaleString() + '명';
}
document.getElementById('notice-partner')?.addEventListener('change', updateNoticeTargetCount);
async function sendNotice(btn) {
  if (!window.opClient) return;
  const titleEl = document.getElementById('notice-title');
  const bodyEl = document.getElementById('notice-body');
  const title = (titleEl?.value || '').trim();
  const body = (bodyEl?.value || '').trim();
  const partnerIds = getNoticeTargetIds();
  if (!title) { showToast('공지 제목을 입력하세요'); titleEl?.focus(); return; }
  if (!body) { showToast('공지 내용을 입력하세요'); bodyEl?.focus(); return; }
  if (!partnerIds.length) { showToast('공지 대상을 선택하세요'); return; }
  if (!confirm('파트너 ' + partnerIds.length.toLocaleString() + '명에게 공지를 발송할까요?')) return;
  const prev = btn?.textContent || '공지 발송';
  if (btn) { btn.disabled = true; btn.textContent = '발송 중...'; }
  const payload = partnerIds.map(partnerId => ({ partner_id: partnerId, type: 'notice', title, body }));
  const { error } = await window.opClient.from('notifications').insert(payload);
  if (btn) { btn.disabled = false; btn.textContent = prev; }
  if (error) { showToast('공지 발송 실패: ' + error.message); return; }
  await logAdminAction('notice_sent', 'notice', null, {
    title,
    body,
    target_type: document.getElementById('notice-target-type')?.value || 'all',
    partner_count: partnerIds.length,
    partner_ids: partnerIds
  });
  if (titleEl) titleEl.value = '';
  if (bodyEl) bodyEl.value = '';
  showToast('공지 발송 완료 ✅');
  await loadRecentNotices();
}
async function loadRecentNotices() {
  const box = document.getElementById('notice-recent-list');
  if (!box || !window.opClient) return;
  const { data, error } = await window.opClient.from('notifications')
    .select('id,partner_id,title,body,created_at')
    .eq('type', 'notice')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    await loadRecentNoticesFromAudit(box);
    return;
  }
  const notices = data || [];
  if (!notices.length) { box.innerHTML = '<div class="adm-empty"><div class="ico">📣</div><b>아직 발송한 공지가 없어요</b></div>'; return; }
  const partnerName = {};
  __noticePartners.forEach(p => { partnerName[p.id] = p.name || p.nickname || p.email || '-'; });
  const groups = {};
  notices.forEach(n => {
    const key = [n.title || '', n.body || '', String(n.created_at || '').slice(0, 16)].join('\n');
    if (!groups[key]) groups[key] = { title: n.title || '-', body: n.body || '', created_at: n.created_at, partner_ids: [] };
    groups[key].partner_ids.push(n.partner_id);
  });
  box.innerHTML = Object.values(groups).slice(0, 10).map(g => {
    const names = g.partner_ids.slice(0, 3).map(id => partnerName[id] || '파트너').join(', ');
    const extra = g.partner_ids.length > 3 ? ' 외 ' + (g.partner_ids.length - 3).toLocaleString() + '명' : '';
    return '<div class="notice-recent-item">' +
      '<div class="notice-recent-head"><b>' + admEsc(g.title) + '</b><span>' + admEsc(String(g.created_at || '').replace('T', ' ').slice(0, 16)) + '</span></div>' +
      '<div class="notice-recent-body">' + admEsc(g.body) + '</div>' +
      '<div class="notice-recent-meta">발송 ' + g.partner_ids.length.toLocaleString() + '명 · ' + admEsc(names + extra) + '</div>' +
      '</div>';
  }).join('');
}
async function loadRecentNoticesFromAudit(box) {
  const { data, error } = await window.opClient.from('admin_audit_log')
    .select('created_at,detail')
    .eq('action', 'notice_sent')
    .eq('target_type', 'notice')
    .order('created_at', { ascending: false })
    .limit(10);
  if (error) { box.innerHTML = '<div class="adm-empty"><b>공지 목록을 불러오지 못했어요</b>' + admEsc(error.message) + '</div>'; return; }
  if (!(data || []).length) { box.innerHTML = '<div class="adm-empty"><div class="ico">📣</div><b>아직 발송한 공지가 없어요</b></div>'; return; }
  box.innerHTML = (data || []).map(l => {
    const d = l.detail || {};
    return '<div class="notice-recent-item">' +
      '<div class="notice-recent-head"><b>' + admEsc(d.title || '-') + '</b><span>' + admEsc(String(l.created_at || '').replace('T', ' ').slice(0, 16)) + '</span></div>' +
      '<div class="notice-recent-body">' + admEsc(d.body || '') + '</div>' +
      '<div class="notice-recent-meta">발송 ' + Number(d.partner_count || 0).toLocaleString() + '명 · 감사 로그 기준</div>' +
      '</div>';
  }).join('');
}

// ── 관리자 오버뷰 실집계
async function loadAdminOverview() {
  if (!window.opClient) return;
  const [pRes, lRes, cRes, recentPartners, settleRes] = await Promise.all([
    window.opClient.from('partners').select('id,email'),
    window.opClient.from('partner_links').select('id', { count: 'exact', head: true }),
    window.opClient.from('conversions').select('commission_amount,order_amount,status,created_at,link_id,partner_links(title)').order('created_at', { ascending: false }),
    window.opClient.from('partners').select('name,nickname,email,created_at').order('created_at', { ascending: false }).limit(10),
    window.opClient.from('settlements').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  ]);
  // 관리자 계정 제외한 파트너 수
  const partnerCount = (pRes.data || []).filter(p => !OP_ADMIN_EMAILS.includes((p.email || '').toLowerCase())).length;
  const convs = cRes.data || [];
  const now = new Date();
  const thisMonth = convs.filter(c => { const d = new Date(c.created_at); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && c.status !== 'canceled'; });
  const monthGmv = thisMonth.reduce((s, c) => s + Number(c.order_amount || 0), 0);
  const monthComm = thisMonth.reduce((s, c) => s + Number(c.commission_amount || 0), 0);

  const cards = document.querySelectorAll('#ap-overview .admin-card-value');
  if (cards[0]) cards[0].textContent = partnerCount.toLocaleString();
  if (cards[1]) cards[1].textContent = (lRes.count || 0).toLocaleString();
  if (cards[2]) cards[2].textContent = '₩' + Math.round(monthGmv).toLocaleString();
  if (cards[3]) cards[3].textContent = '₩' + Math.round(monthComm).toLocaleString();

  // 처리 대기 카운트
  const pendReview = convs.filter(c => c.status === 'pending').length;
  const rv = document.getElementById('ov-pend-review'); if (rv) rv.textContent = pendReview.toLocaleString();
  const sv = document.getElementById('ov-pend-settle'); if (sv) sv.textContent = (settleRes.count || 0).toLocaleString();

  drawAdminOverviewChart(convs);
  renderTopProducts(convs);
  const recentNonAdmin = (recentPartners.data || []).filter(p => !OP_ADMIN_EMAILS.includes((p.email || '').toLowerCase())).slice(0, 5);
  renderRecentActivity(convs, recentNonAdmin);
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
  // 테마별 색 (라이트=핑크, 다크=라임)
  const cs = getComputedStyle(document.documentElement);
  const lime = (cs.getPropertyValue('--lime') || 'var(--lime)').trim();
  const dotBg = (cs.getPropertyValue('--dark3') || '#141414').trim();
  const labelCol = (cs.getPropertyValue('--text3') || 'rgba(255,255,255,0.22)').trim();
  const pathD = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  svg.querySelector('.ac-area')?.setAttribute('d', pathD + ` L${pts.at(-1).x.toFixed(1)},${PAD.t + cH} L${PAD.l},${PAD.t + cH} Z`);
  const lineEl = svg.querySelector('.ac-line'); if (lineEl) { lineEl.setAttribute('d', pathD); lineEl.setAttribute('stroke', lime); }
  const dg = svg.querySelector('.ac-dots');
  if (dg) dg.innerHTML = pts.map((p, i) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${i === pts.length - 1 ? 5 : 3}" fill="${i === pts.length - 1 ? lime : dotBg}" stroke="${lime}" stroke-width="1.5"/>`).join('');
  const lg = svg.querySelector('.ac-labels');
  if (lg) lg.innerHTML = labels.map((l, i) => `<text x="${(PAD.l + (i / (labels.length - 1)) * cW).toFixed(1)}" y="${H}" text-anchor="middle" fill="${labelCol}" font-size="10">${l}</text>`).join('');
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
  await logAdminAction('review_conversion', 'conversion', id, { status, partner_id: c?.partner_id || null });
  if (c && (status === 'confirmed' || status === 'canceled')) {
    await createPartnerNotification(
      c.partner_id,
      status === 'confirmed' ? 'conversion_confirmed' : 'conversion_canceled',
      status === 'confirmed' ? '전환이 확정됐어요' : '전환이 취소됐어요',
      status === 'confirmed'
        ? '구매가 확정되어 수수료가 정산 대상에 포함됩니다.'
        : '반품·취소로 전환이 취소 처리되었습니다.'
    );
  }
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
    .select('id,commission_amount,status,partner_id,partners(name,nickname,bank_name,bank_account,bank_holder,tax_type,resident_no,business_no)')
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
    const hasBank = !!(g.p.bank_name && g.p.bank_account);
    const isBiz = g.p.tax_type === 'business';
    const hasTax = isBiz ? !!g.p.business_no : !!g.p.resident_no;
    const canPay = hasBank && hasTax;
    const bank = hasBank ? (admEsc(g.p.bank_name) + ' ' + admEsc(g.p.bank_account) + '<br><span style="font-size:11px;color:var(--text3);">' + admEsc(g.p.bank_holder || '') + '</span>') : '<span style="color:#FF4D6A;font-size:12px;">계좌 미등록</span>';
    const wh = isBiz ? 0 : Math.round(g.sum * 0.033);
    const net = Math.round(g.sum) - wh;
    const reasons = [];
    if (!hasBank) reasons.push('계좌 미등록');
    if (!hasTax) reasons.push('세금정보 미완성');
    const reasonBadges = reasons.map(r => '<span class="settle-hold-badge">' + admEsc(r) + '</span>').join('');
    const taxCell = isBiz
      ? '<span style="color:var(--text3);font-size:12px;">사업자<br>(세금계산서)</span>'
      : '<span style="color:#FF4D6A;font-size:13px;">-₩' + wh.toLocaleString() + '</span><br><span style="font-size:11px;color:var(--text3);">3.3%</span>';
    return '<tr>' +
      '<td><b>' + admEsc(g.p.name || g.p.nickname || '-') + '</b></td>' +
      '<td>' + g.cnt + '건</td>' +
      '<td style="font-weight:700;">₩' + Math.round(g.sum).toLocaleString() + '</td>' +
      '<td>' + taxCell + '</td>' +
      '<td style="color:var(--lime);font-weight:800;font-size:15px;">₩' + net.toLocaleString() + '</td>' +
      '<td style="font-size:12px;">' + bank + (reasonBadges ? '<div class="settle-hold-wrap">' + reasonBadges + '</div>' : '') + '</td>' +
      '<td style="text-align:right;"><button class="comm-save" ' + (canPay ? '' : 'disabled style="opacity:.4;cursor:not-allowed;"') + ' onclick="paySettle(\'' + admEsc(g.pid) + '\',this)">지급 처리</button></td>' +
      '</tr>';
  }).join('');
  // 캐시(지급 시 사용)
  window.__settleGroups = groups;
}
async function paySettle(pid, btn) {
  if (!window.opClient) return;
  const g = window.__settleGroups && window.__settleGroups[pid];
  if (!g) return;
  const hasBank = !!(g.p.bank_name && g.p.bank_account);
  const hasTax = g.p.tax_type === 'business' ? !!g.p.business_no : !!g.p.resident_no;
  if (!hasBank || !hasTax) { showToast('계좌/세금정보 확인 후 지급할 수 있어요'); return; }
  const gross = Math.round(g.sum);
  const withholding = g.p.tax_type === 'business' ? 0 : Math.round(gross * 0.033);
  const net = gross - withholding;
  if (!confirm(g.p.name + '님에게 ₩' + net.toLocaleString() + ' 정산 지급 처리할까요?\n총수수료 ₩' + gross.toLocaleString() + ' / 원천징수 ₩' + withholding.toLocaleString() + '\n(' + g.cnt + '건의 전환이 정산 완료됩니다)')) return;
  btn.disabled = true; btn.textContent = '처리 중...';
  const period = new Date().toISOString().slice(0, 7);
  const bankSnap = (g.p.bank_name || '') + ' ' + (g.p.bank_account || '') + ' (' + (g.p.bank_holder || '') + ')';
  const nowIso = new Date().toISOString();
  // 1) settlement upsert (같은 달 재지급 시 누적)
  const { data: existing } = await window.opClient.from('settlements').select('id,total_amount,gross_amount,withholding_amount,net_amount').eq('partner_id', pid).eq('period', period).maybeSingle();
  let sErr;
  if (existing) {
    ({ error: sErr } = await window.opClient.from('settlements').update({
      total_amount: Number(existing.total_amount || 0) + net,
      gross_amount: Number(existing.gross_amount || 0) + gross,
      withholding_amount: Number(existing.withholding_amount || 0) + withholding,
      net_amount: Number(existing.net_amount || 0) + net,
      status: 'paid',
      bank_snapshot: bankSnap,
      paid_at: nowIso
    }).eq('id', existing.id));
  } else {
    ({ error: sErr } = await window.opClient.from('settlements').insert({
      partner_id: pid,
      period,
      total_amount: net,
      gross_amount: gross,
      withholding_amount: withholding,
      net_amount: net,
      status: 'paid',
      bank_snapshot: bankSnap,
      paid_at: nowIso
    }));
  }
  if (sErr) { btn.disabled = false; btn.textContent = '지급 처리'; showToast('정산 저장 실패: ' + sErr.message); return; }
  // 1-1) 온종일팜 캐시 적립: 실패해도 정산 기록은 유지
  let cashCreditOk = false;
  try {
    const { error: cashErr } = await window.opClient.rpc('cp_add_cash', {
      p_user: pid,
      p_amount: net,
      p_source: 'partner_settlement',
      p_ref_type: 'settlement',
      p_ref_id: period,
      p_memo: period + ' 정산 지급'
    });
    if (cashErr) throw cashErr;
    cashCreditOk = true;
  } catch (err) {
    console.warn('cp_add_cash failed:', err);
    showToast('정산은 저장됐지만 캐시 적립 실패: ' + (err?.message || err));
  }
  // 2) 해당 전환 settled
  const { error: cErr } = await window.opClient.from('conversions').update({ status: 'settled' }).in('id', g.ids);
  if (cErr) { showToast('전환 상태 갱신 실패: ' + cErr.message); }
  await createPartnerNotification(
    pid,
    'settlement_paid',
    '정산이 완료됐어요',
    '₩' + net.toLocaleString() + ' 정산이 지급 처리됐습니다.'
  );
  await logAdminAction('pay_settlement', 'settlement', pid, { partner_id: pid, period, gross_amount: gross, withholding_amount: withholding, net_amount: net, cash_credit_ok: cashCreditOk, conversion_ids: g.ids });
  if (cashCreditOk) showToast(g.p.name + '님 정산 및 캐시 적립 완료 ✅');
  loadSettle();
}

// ══════════ 정산 내역 ══════════
let __admSettlements = [];
async function loadSettleHistory() {
  if (!window.opClient) return;
  const tb = document.querySelector('#settle-history-table tbody');
  const { data, error } = await window.opClient.from('settlements')
    .select('period,total_amount,gross_amount,withholding_amount,net_amount,status,paid_at,partners(name,nickname,tax_type,resident_no,business_no,bank_name,bank_account,bank_holder)')
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

function csvEscape(v) {
  let s = String(v == null ? '' : v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function downloadCsv(filename, rows) {
  const csv = '\ufeff' + rows.map(row => row.map(csvEscape).join(',')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
async function exportSettlementTaxCsv() {
  if (!window.opClient) return;
  const { data, error } = await window.opClient.from('settlements')
    .select('period,total_amount,gross_amount,withholding_amount,net_amount,status,paid_at,partners(name,nickname,tax_type,resident_no,business_no,bank_name,bank_account,bank_holder)')
    .order('period', { ascending: false }).order('created_at', { ascending: false });
  if (error) { showToast('CSV 내보내기 실패: ' + error.message); return; }
  const header = ['기간', '파트너명', '사업자/개인구분', '주민번호or사업자번호', '은행', '계좌', '예금주', '총수수료(gross)', '원천징수(withholding)', '실지급(net)', '상태', '지급일'];
  const rows = [header].concat((data || []).map(s => {
    const p = s.partners || {};
    const isBiz = p.tax_type === 'business';
    return [
      s.period || '',
      p.name || p.nickname || '',
      taxTypeLabel(p.tax_type),
      isBiz ? (p.business_no || '') : (p.resident_no || ''),
      p.bank_name || '',
      p.bank_account || '',
      p.bank_holder || '',
      Math.round(Number(s.gross_amount || s.total_amount || 0)),
      Math.round(Number(s.withholding_amount || 0)),
      Math.round(Number(s.net_amount || s.total_amount || 0)),
      s.status || '',
      admDate(s.paid_at)
    ];
  }));
  downloadCsv('onpartner_settlements_tax_' + new Date().toISOString().slice(0, 10) + '.csv', rows);
  await logAdminAction('export_settlement_tax_csv', 'settlements', 'csv', { row_count: Math.max(rows.length - 1, 0) });
  showToast('CSV 다운로드를 시작했어요');
}

function setTxt(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

// ══════════ 관리자 감사 로그 ══════════
let __auditFilter = 'all';
const AUDIT_FILTERS = {
  all: null,
  conversion: { targets: ['conversion'], actions: ['review_conversion'] },
  settlement: { targets: ['settlement', 'settlements'], actions: ['pay_settlement', 'export_settlement_tax_csv'] },
  partner: { targets: ['partner'], actions: ['set_partner_status'] },
  commission: { targets: ['product_commission'], actions: ['save_commission'] },
  campaign: { targets: ['campaign', 'partner_ad'], actions: ['create_campaign', 'update_campaign', 'delete_campaign', 'create_ad', 'update_ad', 'toggle_ad', 'delete_ad'] },
  notice: { targets: ['notice'], actions: ['notice_sent'] }
};
document.getElementById('audit-filters')?.addEventListener('click', e => {
  const btn = e.target.closest('[data-audit-filter]');
  if (!btn) return;
  __auditFilter = btn.dataset.auditFilter || 'all';
  loadAuditLog();
});
function auditLogMatchesFilter(row) {
  const rule = AUDIT_FILTERS[__auditFilter];
  if (!rule) return true;
  const action = row.action || '';
  const targetType = row.target_type || '';
  return rule.actions.includes(action) || rule.targets.includes(targetType);
}
async function loadAuditLog() {
  if (!window.opClient) return;
  const tb = document.querySelector('#audit-table tbody');
  const { data, error } = await window.opClient.from('admin_audit_log')
    .select('created_at,action,target_type,target_id,detail')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) { if (tb) tb.innerHTML = '<tr><td colspan="4"><div class="adm-empty">' + admEsc(error.message) + '</div></td></tr>'; return; }
  if (!tb) return;
  const rows = (data || []).filter(auditLogMatchesFilter);
  if (!rows.length) { tb.innerHTML = '<tr><td colspan="4"><div class="adm-empty"><div class="ico">🧾</div><b>감사 로그가 없어요</b></div></td></tr>'; return; }
  tb.innerHTML = rows.map(l => {
    const detail = JSON.stringify(l.detail || {});
    return '<tr>' +
      '<td style="font-size:12px;color:var(--text3);white-space:nowrap;">' + admEsc(String(l.created_at || '').replace('T', ' ').slice(0, 19)) + '</td>' +
      '<td><b>' + admEsc(l.action || '-') + '</b></td>' +
      '<td style="font-size:12px;color:var(--text2);">' + admEsc((l.target_type || '-') + ' · ' + (l.target_id || '-')) + '</td>' +
      '<td><code class="audit-detail-code">' + admEsc(detail) + '</code></td>' +
      '</tr>';
  }).join('');
}

// ══════════ 부정 클릭 탐지 ══════════
async function loadFraud() {
  if (!window.opClient) return;
  const tb = document.querySelector('#fraud-table tbody');
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const [clRes, plRes, pRes, cvRes] = await Promise.all([
    window.opClient.from('link_clicks').select('ip_hash,link_id').gte('clicked_at', since).limit(5000),
    window.opClient.from('partner_links').select('id,partner_id'),
    window.opClient.from('partners').select('id,name,nickname,email,status'),
    window.opClient.from('conversions').select('partner_id,status')
  ]);
  if (clRes.error) { if (tb) tb.innerHTML = '<tr><td colspan="8"><div class="adm-empty">' + admEsc(clRes.error.message) + '</div></td></tr>'; return; }
  const linkToPartner = {}; (plRes.data || []).forEach(l => linkToPartner[l.id] = l.partner_id);
  const pMap = {};
  (pRes.data || []).forEach(p => {
    if (!OP_ADMIN_EMAILS.includes((p.email || '').toLowerCase())) pMap[p.id] = p;
  });
  const convCnt = {}; (cvRes.data || []).forEach(c => { if (c.status !== 'canceled') convCnt[c.partner_id] = (convCnt[c.partner_id] || 0) + 1; });
  const agg = {};
  (clRes.data || []).forEach(cl => {
    const pid = linkToPartner[cl.link_id]; if (!pid) return;
    if (!pMap[pid]) return;
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
    return { pid: a.pid, clicks: a.clicks, uniqIp, maxRep, conv, cvr, risk, status: pMap[a.pid]?.status || 'active' };
  }).sort((x, y) => (rank[y.risk] - rank[x.risk]) || (y.clicks - x.clicks));
  setTxt('fr-total', totalClicks.toLocaleString());
  setTxt('fr-suspect', suspectClicks.toLocaleString());
  setTxt('fr-flagged', flagged.toLocaleString());
  const badge = document.getElementById('nav-fraud-badge');
  if (badge) { badge.textContent = flagged; badge.style.display = flagged ? '' : 'none'; }
  if (!tb) return;
  if (!rows.length) { tb.innerHTML = '<tr><td colspan="8"><div class="adm-empty"><div class="ico">🚨</div><b>클릭 데이터가 없어요</b>링크 클릭이 쌓이면 자동 분석됩니다</div></td></tr>'; return; }
  tb.innerHTML = rows.map(r => {
    const pill = r.risk === 'danger' ? '<span class="status-pill paused">🔴 위험</span>' : r.risk === 'warn' ? '<span class="status-pill pending">🟡 주의</span>' : '<span class="status-pill active">🟢 정상</span>';
    const repHot = (r.maxRep >= r.clicks * 0.6 && r.clicks >= 10);
    const partner = pMap[r.pid] || {};
    const partnerName = partner.name || partner.nickname || '-';
    const suspendAction = r.status === 'suspended'
      ? '<span class="status-pill paused">정지됨</span>'
      : (r.risk === 'danger' || r.risk === 'warn')
        ? '<button class="admin-action-btn reject" onclick="setPartnerStatus(\'' + admEsc(r.pid) + '\',\'suspended\',this)">정지</button>'
        : '';
    return '<tr>' +
      '<td><b>' + admEsc(partnerName) + '</b></td>' +
      '<td>' + r.clicks.toLocaleString() + '</td>' +
      '<td>' + r.uniqIp.toLocaleString() + '</td>' +
      '<td' + (repHot ? ' style="color:#FF4D6A;font-weight:700;"' : '') + '>' + r.maxRep + '회</td>' +
      '<td>' + r.conv + '</td>' +
      '<td>' + (r.cvr * 100).toFixed(1) + '%</td>' +
      '<td>' + pill + '</td>' +
      '<td style="text-align:right;white-space:nowrap;">' +
        '<button class="admin-action-btn" onclick="openPartnerDetail(\'' + admEsc(r.pid) + '\')">상세</button> ' + suspendAction +
      '</td></tr>';
  }).join('');
}

// ══════════ 시즌 캠페인 CRUD ══════════
let __campaigns = [];
let __campProducts = [];
let __campCategories = [];
let __campSelectedProducts = new Set();
let __campProductRates = {};
let __campProductCounts = {};
let __campProductSummaries = {};
async function loadCampaigns() {
  if (!window.opClient) return;
  const box = document.getElementById('campaign-list');
  const [campRes, catRes, cpRes] = await Promise.all([
    window.opClient.from('campaigns').select('*').order('starts_at', { ascending: false }),
    window.opClient.from('categories').select('id,name,sort_order').order('sort_order', { ascending: true }),
    window.opClient.from('campaign_products').select('campaign_id,product_id,bonus_rate,products(name)')
  ]);
  if (campRes.error) { if (box) box.innerHTML = '<div class="adm-empty"><div class="ico">⚠️</div><b>캠페인을 불러오지 못했어요</b>' + admEsc(campRes.error.message) + '</div>'; return; }
  __campaigns = campRes.data || [];
  if (!catRes.error) __campCategories = catRes.data || [];
  __campProductCounts = {};
  __campProductSummaries = {};
  if (!cpRes.error) {
    (cpRes.data || []).forEach(r => {
      const campaignId = String(r.campaign_id);
      __campProductCounts[campaignId] = (__campProductCounts[campaignId] || 0) + 1;
      const productName = r.products && !Array.isArray(r.products) ? r.products.name : '';
      if (!__campProductSummaries[campaignId]) __campProductSummaries[campaignId] = [];
      __campProductSummaries[campaignId].push({
        name: productName || r.product_id,
        rate: r.bonus_rate
      });
    });
  }
  renderCampaigns();
}
async function ensureCampaignPickerData() {
  if (!window.opClient) return;
  const needsProducts = !__campProducts.length;
  const needsCategories = !__campCategories.length;
  if (!needsProducts && !needsCategories) return;
  const [pRes, cRes] = await Promise.all([
    needsProducts ? window.opClient.from('products').select('id,name,retail_price,image_url,category_id,is_active').order('name', { ascending: true }) : Promise.resolve({ data: __campProducts }),
    needsCategories ? window.opClient.from('categories').select('id,name,sort_order').order('sort_order', { ascending: true }) : Promise.resolve({ data: __campCategories })
  ]);
  if (!pRes.error) __campProducts = pRes.data || [];
  if (!cRes.error) __campCategories = cRes.data || [];
}
function renderCampaignCategorySelect(selectedValue) {
  const sel = document.getElementById('cm-target-value');
  if (!sel) return;
  sel.innerHTML = '<option value="">카테고리를 선택하세요</option>' +
    __campCategories.map(c => '<option value="' + admEsc(c.id) + '">' + admEsc(c.name) + '</option>').join('');
  if (selectedValue) sel.value = selectedValue;
}
function renderCampaignProductFilters() {
  const sel = document.getElementById('cm-product-category');
  if (!sel) return;
  const used = {};
  __campProducts.forEach(p => { if (p.category_id) used[String(p.category_id)] = true; });
  const cats = __campCategories.filter(c => used[String(c.id)]);
  const current = sel.value || 'all';
  sel.innerHTML = '<option value="all">전체 카테고리</option>' +
    cats.map(c => '<option value="' + admEsc(c.id) + '">' + admEsc(c.name) + '</option>').join('');
  sel.value = used[current] ? current : 'all';
}
function updateCampaignProductCount() {
  const el = document.getElementById('cm-product-count');
  if (el) el.textContent = '선택 ' + __campSelectedProducts.size.toLocaleString() + '개';
}
function toggleCampaignProduct(productId, checked) {
  const id = String(productId);
  if (checked) {
    __campSelectedProducts.add(id);
    if (__campProductRates[id] == null || __campProductRates[id] === '') {
      __campProductRates[id] = clampCampaignBonusPct(document.getElementById('cm-bonus')?.value) || 0;
    }
  } else {
    __campSelectedProducts.delete(id);
  }
  updateCampaignProductCount();
  renderCampaignProductPicker();
}
function setCampaignProductRate(productId, value) {
  __campProductRates[String(productId)] = value;
}
function renderCampaignProductPicker() {
  const listEl = document.getElementById('cm-product-list');
  if (!listEl) return;
  const q = (document.getElementById('cm-product-search')?.value || '').trim().toLowerCase();
  const category = document.getElementById('cm-product-category')?.value || 'all';
  const categoryMap = {};
  __campCategories.forEach(c => { categoryMap[String(c.id)] = c.name; });
  const list = __campProducts.filter(p => {
    const matchesSearch = !q || String(p.name || '').toLowerCase().includes(q);
    const matchesCategory = category === 'all' || String(p.category_id || '') === category;
    return matchesSearch && matchesCategory;
  });
  updateCampaignProductCount();
  if (!list.length) {
    listEl.innerHTML = '<div class="campaign-product-empty">상품이 없어요.</div>';
    return;
  }
  listEl.innerHTML = list.map(p => {
    const id = String(p.id);
    const img = (p.image_url && /^https?:\/\//.test(p.image_url)) ? p.image_url : '';
    const price = Number(p.retail_price || 0).toLocaleString();
    const isChecked = __campSelectedProducts.has(id);
    const checked = isChecked ? ' checked' : '';
    const rateValue = __campProductRates[id] == null ? '' : __campProductRates[id];
    return '<div class="campaign-product-option">' +
      '<label class="campaign-product-check">' +
      '<input type="checkbox" value="' + admEsc(id) + '"' + checked + ' onchange="toggleCampaignProduct(this.value,this.checked)">' +
      '</label>' +
      '<span class="campaign-product-thumb" style="' + (img ? "background-image:url('" + admEsc(img) + "')" : '') + '">' + (img ? '' : '🛒') + '</span>' +
      '<span class="campaign-product-info"><span class="campaign-product-name">' + admEsc(p.name) + (p.is_active === false ? ' <em>(비활성)</em>' : '') + '</span>' +
      '<span class="campaign-product-meta">' + (categoryMap[String(p.category_id)] ? admEsc(categoryMap[String(p.category_id)]) + ' · ' : '') + '₩' + admEsc(price) + '</span></span>' +
      '<span class="campaign-product-rate"><input type="number" min="0" max="30" step="0.5" value="' + admEsc(rateValue) + '" placeholder="' + admEsc(clampCampaignBonusPct(document.getElementById('cm-bonus')?.value)) + '" ' + (isChecked ? '' : 'disabled ') + 'oninput="setCampaignProductRate(\'' + admEsc(id) + '\',this.value)"><span>%</span></span>' +
    '</div>';
  }).join('');
}
function campStatus(c) {
  const today = new Date().toISOString().slice(0, 10);
  if (c.starts_at > today) return 'scheduled';
  if (c.ends_at < today) return 'ended';
  return 'live';
}
function fmtRate(r) { return (Number(r) * 100).toFixed(1).replace(/\.0$/, ''); }
function clampCampaignBonusPct(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  if (n > 30) return 30;
  return n;
}
function renderCampaigns() {
  const box = document.getElementById('campaign-list');
  if (!box) return;
  if (!__campaigns.length) { box.innerHTML = '<div class="adm-empty"><div class="ico">🎁</div><b>등록된 캠페인이 없어요</b>+ 새 캠페인으로 시즌 프로모션을 만들어보세요</div>'; return; }
  const categoryMap = {};
  __campCategories.forEach(c => { categoryMap[String(c.id)] = c.name; });
  box.innerHTML = __campaigns.map(c => {
    const st = campStatus(c);
    const stPill = !c.is_active ? '<span class="camp-status ended">비활성</span>'
      : st === 'scheduled' ? '<span class="camp-status scheduled">예정</span>'
      : st === 'ended' ? '<span class="camp-status ended">종료</span>'
      : '<span class="camp-status live">진행중</span>';
    const categoryName = categoryMap[String(c.target_value || '')] || c.target_value || '카테고리';
    const campaignId = String(c.id);
    const productCount = Number(__campProductCounts[campaignId] || 0);
    const productSummaryList = (__campProductSummaries[campaignId] || []).map(r => admEsc(r.name) + ' +' + fmtRate(r.rate) + '%');
    const productSummary = productSummaryList.length
      ? '<details class="camp-product-summary"><summary>상품 ' + productCount.toLocaleString() + '개 (개별 수수료)</summary><div>' + productSummaryList.join(', ') + '</div></details>'
      : '<span class="camp-target-strong">상품 ' + productCount.toLocaleString() + '개 (개별 수수료)</span>';
    const tgt = c.target_type === 'category'
      ? '<span class="camp-target-strong">카테고리: ' + admEsc(categoryName) + ' +' + fmtRate(c.bonus_rate) + '%</span>'
      : c.target_type === 'product'
        ? productSummary
        : '<span class="camp-target-strong">전체 상품 +' + fmtRate(c.bonus_rate) + '%</span>';
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
  document.getElementById('cm-product-wrap').style.display = t === 'product' ? '' : 'none';
  const help = document.getElementById('cm-target-help');
  if (help) {
    help.textContent = t === 'category'
      ? '선택한 카테고리의 모든 상품에 추가 수수료가 적용됩니다.'
      : t === 'product'
        ? '선택한 상품에만 적용됩니다. 상품별로 다른 추가율을 정할 수 있어요.'
        : '모든 온종일팜 상품에 추가 수수료가 적용됩니다.';
  }
  if (t === 'product') renderCampaignProductPicker();
}
async function openCampaignModal(id) {
  await ensureCampaignPickerData();
  const c = id ? __campaigns.find(x => x.id === id) : null;
  __campSelectedProducts = new Set();
  __campProductRates = {};
  document.getElementById('cm-title').textContent = c ? '캠페인 수정' : '새 캠페인';
  document.getElementById('cm-id').value = c ? c.id : '';
  document.getElementById('cm-emoji').value = c ? (c.emoji || '🎁') : '🎁';
  document.getElementById('cm-title-input').value = c ? c.title : '';
  document.getElementById('cm-desc').value = c ? (c.description || '') : '';
  document.getElementById('cm-target-type').value = c ? c.target_type : 'all';
  renderCampaignCategorySelect(c ? (c.target_value || '') : '');
  renderCampaignProductFilters();
  const productSearch = document.getElementById('cm-product-search');
  if (productSearch) productSearch.value = '';
  document.getElementById('cm-bonus').value = c ? Number(c.bonus_rate) * 100 : 3;
  document.getElementById('cm-start').value = c ? c.starts_at : '';
  document.getElementById('cm-end').value = c ? c.ends_at : '';
  document.getElementById('cm-active').checked = c ? c.is_active : true;
  if (c && c.target_type === 'product') {
    const { data, error } = await window.opClient.from('campaign_products').select('product_id,bonus_rate').eq('campaign_id', c.id);
    if (!error) {
      (data || []).forEach(r => {
        const productId = String(r.product_id);
        __campSelectedProducts.add(productId);
        __campProductRates[productId] = fmtRate(r.bonus_rate);
      });
    }
  }
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
  if (tt === 'category' && !document.getElementById('cm-target-value').value) { alert('카테고리를 선택하세요'); return; }
  if (tt === 'product' && __campSelectedProducts.size === 0) { alert('상품을 1개 이상 선택하세요'); return; }
  const payload = {
    title,
    description: document.getElementById('cm-desc').value.trim() || null,
    emoji: document.getElementById('cm-emoji').value || '🎁',
    target_type: tt,
    target_value: tt === 'category' ? (document.getElementById('cm-target-value').value.trim() || null) : null,
    bonus_rate: clampCampaignBonusPct(document.getElementById('cm-bonus').value) / 100,
    starts_at: starts, ends_at: ends,
    is_active: document.getElementById('cm-active').checked
  };
  btn.disabled = true; const t = btn.textContent; btn.textContent = '저장 중...';
  let error;
  let savedId = id;
  if (id) {
    ({ error } = await window.opClient.from('campaigns').update(payload).eq('id', id));
  } else {
    const res = await window.opClient.from('campaigns').insert(payload).select('id').single();
    error = res.error;
    savedId = res.data?.id || '';
  }
  if (!error && savedId) {
    const delRes = await window.opClient.from('campaign_products').delete().eq('campaign_id', savedId);
    if (delRes.error) error = delRes.error;
    if (!error && tt === 'product') {
      const defaultBonusPct = clampCampaignBonusPct(document.getElementById('cm-bonus').value);
      const rows = Array.from(__campSelectedProducts).map(productId => {
        const rawRate = __campProductRates[String(productId)];
        const bonusPct = rawRate == null || rawRate === '' ? defaultBonusPct : clampCampaignBonusPct(rawRate);
        return { campaign_id: savedId, product_id: productId, bonus_rate: bonusPct / 100 };
      });
      const insRes = await window.opClient.from('campaign_products').insert(rows);
      if (insRes.error) error = insRes.error;
    }
  }
  btn.disabled = false; btn.textContent = t;
  if (error) { alert('저장 실패: ' + error.message); return; }
  await logAdminAction(id ? 'update_campaign' : 'create_campaign', 'campaign', savedId, { title: payload.title, starts_at: payload.starts_at, ends_at: payload.ends_at, bonus_rate: payload.bonus_rate, is_active: payload.is_active, product_count: tt === 'product' ? __campSelectedProducts.size : 0 });
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
  const camp = __campaigns.find(c => c.id === id);
  const { error } = await window.opClient.from('campaigns').delete().eq('id', id);
  if (error) { showToast('실패: ' + error.message); return; }
  await logAdminAction('delete_campaign', 'campaign', id, { title: camp?.title || null });
  loadCampaigns(); showToast('캠페인 삭제됨');
}

// ══════════ 광고 관리 CRUD ══════════
let __partnerAds = [];
async function loadAdsAdmin() {
  if (!window.opClient) return;
  const box = document.getElementById('ad-list');
  const { data, error } = await window.opClient.from('partner_ads')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) {
    if (box) box.innerHTML = '<div class="adm-empty"><div class="ico">⚠️</div><b>광고를 불러오지 못했어요</b>' + admEsc(error.message) + '</div>';
    return;
  }
  __partnerAds = data || [];
  renderAdsAdmin();
}
function adStatus(ad) {
  if (!ad.is_active) return 'off';
  const now = Date.now();
  const starts = ad.starts_at ? new Date(ad.starts_at).getTime() : null;
  const ends = ad.ends_at ? new Date(ad.ends_at).getTime() : null;
  if (starts && starts > now) return 'scheduled';
  if (ends && ends < now) return 'expired';
  return 'live';
}
function adStatusPill(ad) {
  const st = adStatus(ad);
  if (st === 'live') return '<span class="camp-status live">노출중</span>';
  if (st === 'scheduled') return '<span class="camp-status scheduled">예약</span>';
  if (st === 'expired') return '<span class="camp-status ended">종료</span>';
  return '<span class="camp-status ended">꺼짐</span>';
}
function renderAdsAdmin() {
  const box = document.getElementById('ad-list');
  if (!box) return;
  if (!__partnerAds.length) {
    box.innerHTML = '<div class="adm-empty"><div class="ico">📢</div><b>등록된 광고가 없어요</b>새 광고로 파트너 추천 상품을 올려보세요</div>';
    return;
  }
  box.innerHTML = __partnerAds.map(ad => {
    const href = ad.product_id ? '온종일팜 상품 연결' : (ad.link_url || '링크 없음');
    return '<div class="ad-admin-card' + (ad.is_active ? '' : ' inactive') + '">' +
      '<div class="ad-admin-image" style="background-image:url(\'' + admEsc(ad.image_url || '') + '\');"></div>' +
      '<div class="ad-admin-body">' +
        '<div class="ad-admin-head">' + adStatusPill(ad) + '<span class="ad-admin-order">순서 ' + admEsc(ad.sort_order || 0) + '</span></div>' +
        '<div class="ad-admin-title">' + admEsc(ad.title || '제목 없음') + '</div>' +
        '<div class="ad-admin-sub">' + admEsc(ad.subtitle || '') + '</div>' +
        '<div class="ad-admin-meta">' + (ad.tag ? admEsc(ad.tag) + ' · ' : '') + admEsc(href) + '<br>' + admEsc(adDateRange(ad)) + '</div>' +
        '<div class="ad-admin-footer">' +
          '<label class="ad-toggle"><input type="checkbox" ' + (ad.is_active ? 'checked' : '') + ' onchange="toggleAd(\'' + admEsc(ad.id) + '\',this.checked)"><span></span></label>' +
          '<div class="camp-actions">' +
            '<button class="camp-icon-btn" title="수정" onclick="openAdModal(\'' + admEsc(ad.id) + '\')">✏️</button>' +
            '<button class="camp-icon-btn del" title="삭제" onclick="deleteAd(\'' + admEsc(ad.id) + '\')">🗑</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}
function adDateRange(ad) {
  const start = ad.starts_at ? String(ad.starts_at).replace('T', ' ').slice(0, 16) : '즉시';
  const end = ad.ends_at ? String(ad.ends_at).replace('T', ' ').slice(0, 16) : '상시';
  return start + ' ~ ' + end;
}
function toDatetimeLocal(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
function fromDatetimeLocal(value) {
  return value ? new Date(value).toISOString() : null;
}
function isHttpUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return /^https?:$/.test(url.protocol);
  } catch (e) {
    return false;
  }
}
async function ensureAdProducts() {
  await ensureCampaignPickerData();
  const sel = document.getElementById('ad-product');
  if (!sel) return;
  sel.innerHTML = '<option value="">상품 선택 안 함</option>' + __campProducts.map(p => {
    const label = (p.name || '상품명 없음') + (p.is_active === false ? ' (비활성)' : '');
    return '<option value="' + admEsc(p.id) + '">' + admEsc(label) + '</option>';
  }).join('');
}
function bindAdPreviewEvents() {
  ['ad-image-url','ad-tag','ad-title-input','ad-subtitle','ad-cta'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', renderAdPreview);
  });
  // 연결 상품 선택 시 → 상품 이미지·제목 자동 채움
  document.getElementById('ad-product')?.addEventListener('change', onAdProductChange);
}
bindAdPreviewEvents();
// 연결 상품 선택 시 이미지/제목 자동 채우기
function onAdProductChange() {
  const pid = document.getElementById('ad-product')?.value;
  if (!pid) return;
  const p = (__campProducts || []).find(x => String(x.id) === String(pid));
  if (!p) return;
  const imgEl = document.getElementById('ad-image-url');
  const titleEl = document.getElementById('ad-title-input');
  // 이미지 칸이 비어있으면 상품 이미지 자동 입력 (기존 입력값은 존중)
  if (imgEl && !imgEl.value.trim() && p.image_url && /^https?:\/\//.test(p.image_url)) {
    imgEl.value = p.image_url;
  }
  // 제목이 비어있으면 상품명 자동 입력
  if (titleEl && !titleEl.value.trim() && p.name) {
    titleEl.value = p.name;
  }
  renderAdPreview();
}
async function openAdModal(id) {
  await ensureAdProducts();
  const ad = id ? __partnerAds.find(x => x.id === id) : null;
  document.getElementById('ad-modal-title').textContent = ad ? '광고 수정' : '새 광고';
  document.getElementById('ad-id').value = ad ? ad.id : '';
  document.getElementById('ad-image-url').value = ad ? (ad.image_url || '') : '';
  document.getElementById('ad-tag').value = ad ? (ad.tag || '') : 'BEST';
  document.getElementById('ad-title-input').value = ad ? (ad.title || '') : '';
  document.getElementById('ad-subtitle').value = ad ? (ad.subtitle || '') : '';
  document.getElementById('ad-cta').value = ad ? (ad.cta_label || '') : '자세히 보기';
  document.getElementById('ad-product').value = ad ? (ad.product_id || '') : '';
  document.getElementById('ad-link-url').value = ad ? (ad.link_url || '') : '';
  document.getElementById('ad-sort').value = ad ? (Number(ad.sort_order) || 0) : 0;
  document.getElementById('ad-start').value = ad ? toDatetimeLocal(ad.starts_at) : '';
  document.getElementById('ad-end').value = ad ? toDatetimeLocal(ad.ends_at) : '';
  document.getElementById('ad-active').checked = ad ? ad.is_active : true;
  renderAdPreview();
  openModal('ad-modal');
}
function renderAdPreview() {
  const box = document.getElementById('ad-preview');
  if (!box) return;
  const img = document.getElementById('ad-image-url')?.value.trim() || '';
  const tag = document.getElementById('ad-tag')?.value.trim() || 'AD';
  const title = document.getElementById('ad-title-input')?.value.trim() || '광고 제목 미리보기';
  const sub = document.getElementById('ad-subtitle')?.value.trim() || '파트너 대시보드에 표시될 광고 문구입니다.';
  const cta = document.getElementById('ad-cta')?.value.trim() || '자세히 보기';
  box.innerHTML = '<div class="ad-preview-bg" style="background-image:url(\'' + admEsc(img) + '\');"></div>' +
    '<div class="ad-preview-shade"></div>' +
    '<div class="ad-preview-content">' +
      '<div class="ad-preview-badge"><span></span> AD 추천 광고중</div>' +
      '<div class="ad-preview-tag">' + admEsc(tag) + '</div>' +
      '<h3>' + admEsc(title) + '</h3>' +
      '<p>' + admEsc(sub) + '</p>' +
      '<button type="button">' + admEsc(cta) + ' →</button>' +
    '</div>';
}
async function saveAd(btn) {
  if (!window.opClient) return;
  const id = document.getElementById('ad-id').value;
  const productId = document.getElementById('ad-product').value || null;
  // 이미지 비었으면 선택한 연결 상품 이미지로 자동 채움
  let imageUrl = document.getElementById('ad-image-url').value.trim();
  if (!imageUrl && productId) {
    const p = (__campProducts || []).find(x => String(x.id) === String(productId));
    if (p && p.image_url && /^https?:\/\//.test(p.image_url)) {
      imageUrl = p.image_url;
      const imgEl = document.getElementById('ad-image-url'); if (imgEl) imgEl.value = imageUrl;
    }
  }
  const title = document.getElementById('ad-title-input').value.trim();
  const linkUrl = document.getElementById('ad-link-url').value.trim() || null;
  const startsAt = fromDatetimeLocal(document.getElementById('ad-start').value);
  const endsAt = fromDatetimeLocal(document.getElementById('ad-end').value);
  if (!imageUrl) { showToast('이미지 URL을 입력하거나, 이미지가 있는 상품을 선택하세요'); return; }
  if (!isHttpUrl(imageUrl)) { showToast('이미지 URL은 http(s) 주소만 사용할 수 있어요'); return; }
  if (!title) { showToast('제목을 입력하세요'); return; }
  if (!productId && !linkUrl) { showToast('연결 상품 또는 링크 URL을 입력하세요'); return; }
  if (linkUrl && !isHttpUrl(linkUrl)) { showToast('링크 URL은 http(s) 주소만 사용할 수 있어요'); return; }
  if (startsAt && endsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime()) { showToast('종료일시가 시작일시보다 빠릅니다'); return; }
  const payload = {
    tag: document.getElementById('ad-tag').value.trim() || null,
    title,
    subtitle: document.getElementById('ad-subtitle').value.trim() || null,
    cta_label: document.getElementById('ad-cta').value.trim() || '자세히 보기',
    image_url: imageUrl,
    product_id: productId,
    link_url: productId ? null : linkUrl,
    sort_order: Number(document.getElementById('ad-sort').value) || 0,
    starts_at: startsAt,
    ends_at: endsAt,
    is_active: document.getElementById('ad-active').checked
  };
  btn.disabled = true; const prev = btn.textContent; btn.textContent = '저장 중...';
  let error;
  let savedId = id;
  if (id) {
    ({ error } = await window.opClient.from('partner_ads').update(payload).eq('id', id));
  } else {
    const res = await window.opClient.from('partner_ads').insert(payload).select('id').single();
    error = res.error;
    savedId = res.data?.id || '';
  }
  btn.disabled = false; btn.textContent = prev;
  if (error) { showToast('광고 저장 실패: ' + error.message); return; }
  await logAdminAction(id ? 'update_ad' : 'create_ad', 'partner_ad', savedId, { title: payload.title, product_id: payload.product_id, sort_order: payload.sort_order, is_active: payload.is_active });
  closeModal('ad-modal');
  showToast('광고 저장 완료 ✅');
  loadAdsAdmin();
}
async function toggleAd(id, active) {
  if (!window.opClient) return;
  const { error } = await window.opClient.from('partner_ads').update({ is_active: active }).eq('id', id);
  if (error) { showToast('실패: ' + error.message); return; }
  await logAdminAction('toggle_ad', 'partner_ad', id, { is_active: active });
  const ad = __partnerAds.find(x => x.id === id); if (ad) ad.is_active = active;
  renderAdsAdmin();
  showToast(active ? '광고 활성화 ✅' : '광고 꺼짐');
}
async function deleteAd(id) {
  if (!window.opClient) return;
  if (!confirm('이 광고를 삭제할까요?')) return;
  const ad = __partnerAds.find(x => x.id === id);
  const { error } = await window.opClient.from('partner_ads').delete().eq('id', id);
  if (error) { showToast('실패: ' + error.message); return; }
  await logAdminAction('delete_ad', 'partner_ad', id, { title: ad?.title || null });
  loadAdsAdmin();
  showToast('광고 삭제됨');
}

// 초기 진입 시 오버뷰 로드
document.addEventListener('DOMContentLoaded', () => { setTimeout(loadAdminOverview, 300); });
