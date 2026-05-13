// ── 관리자 인증 확인
if (!sessionStorage.getItem('ptnr_admin')) {
  window.location.href = 'admin-login.html';
}

// ── 테마 (항상 다크 고정)
document.documentElement.setAttribute('data-theme', 'dark');

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
function adminLogout() {
  sessionStorage.removeItem('ptnr_admin');
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
