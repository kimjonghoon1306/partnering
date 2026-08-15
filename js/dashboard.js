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

const SERVICE_BENEFITS = {
  farm: { kicker:'ONJONGIL FARM', title:'온종일팜 알아보기', hook:'잘 팔리는 상품을 찾아 헤매지 마세요. 산지 상품을 고르고 내 추천 링크로 연결하면 콘텐츠가 실제 구매로 이어집니다.', items:[['신선한 상품 소싱','제철 먹거리와 산지 상품을 한곳에서 찾습니다.'],['수익 링크와 바로 연결','고른 상품을 온파트너 추천 링크로 만들어 판매 성과를 추적합니다.'],['쇼핑포인트 활용','온파트너 캐시를 쇼핑포인트로 바꿔 직접 구매에도 사용할 수 있습니다.']], flow:'상품 선택 → 온파트너 링크 발급 → SNS·블로그 홍보 → 온종일팜 구매 전환', cta:'온종일팜 이용하기', url:'https://app.yuanfnb.com' },
  trial: { kicker:'COMING SOON', title:'온종일 체험단 알아보기', hook:'좋아하는 상품과 매장을 먼저 경험하고, 진짜 경험이 담긴 리뷰로 콘텐츠의 신뢰도와 영향력을 함께 키워보세요.', items:[['상품·매장 직접 체험','관심 있는 캠페인을 골라 실제 경험을 콘텐츠로 만듭니다.'],['리뷰 소재 확보','사진과 경험이 쌓여 블로그·SNS 콘텐츠가 더 풍성해집니다.'],['크리에이터 성장','꾸준한 리뷰 활동으로 포트폴리오와 협업 기회를 넓힙니다.']], flow:'캠페인 발견 → 체험 신청 → 상품·매장 경험 → 진정성 있는 리뷰 발행', cta:'신청하기', coming:true },
  publy: { kicker:'DESKTOP · LAPTOP APP', title:'퍼블리 알아보기', hook:'상품 하나를 검색에 강한 블로그 글로 바꾸고, 반복되는 글쓰기와 발행 업무는 자동화하세요.', items:[['네이버 블로그 최적화 AI 글쓰기','키워드·질문형 소제목·SEO 구조를 반영해 글을 완성합니다.'],['설치형 자동 발행','데스크탑·노트북 앱이 네이버·티스토리 발행을 대신 처리합니다.'],['관계·소통 자동화','서이추·공감·댓글·인스타 DM 업무를 한곳에서 관리합니다.']], flow:'온파트너 상품 링크 준비 → 퍼블리 글 생성 → PC 앱 자동 발행 → 검색 유입과 구매 연결', cta:'퍼블리 시작하기', url:'https://publy.blogautopro.com' }
};
function openServiceBenefit(key) {
  const data = SERVICE_BENEFITS[key]; if (!data) return;
  document.getElementById('service-benefit-kicker').textContent = data.kicker;
  document.getElementById('service-benefit-title').textContent = data.title;
  document.getElementById('service-benefit-hook').textContent = data.hook;
  document.getElementById('service-benefit-list').innerHTML = data.items.map(x => '<div class="service-benefit-item"><b>✓ '+escHtml(x[0])+'</b><span>'+escHtml(x[1])+'</span></div>').join('');
  document.getElementById('service-benefit-flow').textContent = data.flow;
  document.getElementById('service-benefit-footer').innerHTML = data.coming ? '<span class="service-benefit-cta" aria-disabled="true">신청하기</span><span class="service-coming">곧 출시됩니다</span>' : '<a class="service-benefit-cta" href="'+data.url+'" target="_blank" rel="noopener">'+data.cta+' →</a>';
  document.getElementById('service-benefit-modal').hidden = false;
  document.body.style.overflow = 'hidden';
}
function closeServiceBenefit(){ const modal=document.getElementById('service-benefit-modal'); if(modal) modal.hidden=true; document.body.style.overflow=''; }

// ── 사이드바 네비게이션
const navItems = document.querySelectorAll('.nav-item[data-page]');
const pages = document.querySelectorAll('.page');

function showPage(pageId) {
  if (window.__opAdminView && pageId === 'settings') return;
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
  if (pageId === 'wallet') loadWallet();
  if (pageId === 'notifications') loadNotifications();
  if (pageId === 'settings') loadSettings();
}

function setLinkWorkspace(mode) {
  const products = mode !== 'mine';
  document.getElementById('link-workspace-products')?.classList.toggle('active', products);
  document.getElementById('link-workspace-mine')?.classList.toggle('active', !products);
  document.getElementById('link-tab-products')?.classList.toggle('active', products);
  document.getElementById('link-tab-mine')?.classList.toggle('active', !products);
  if (!products) loadLinks();
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
    if (this.dataset.earningsRange) renderMonthlyEarningsChart(this.dataset.earningsRange);
  });
});

// ── 수익 라인 차트 (SVG)
let chartData = {
  '7d': buildEmptyDailySeries(7),
  '1m': buildEmptyDailySeries(30),
  '3m': buildEmptyDailySeries(90)
};
let monthlyEarningsData = { '6m': [], '12m': [] };
let __adSlides = [];
let __adIndex = 0;
let __adTimer = null;

function pad2(n) { return String(n).padStart(2, '0'); }
function dateKey(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
// 한국시간(KST, UTC+9) 기준 오늘 날짜 (캠페인 기간 비교용 — UTC로 하면 자정~9시 사이 하루 어긋남)
function todayKST() {
  const kst = new Date(Date.now() + 9 * 3600 * 1000);
  return kst.toISOString().slice(0, 10);
}
// "2026-07-18" → "7.18"
function fmtCampaignDate(s) {
  const m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? (Number(m[2]) + '.' + Number(m[3])) : String(s || '');
}
function monthKey(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1); }
function dayLabel(d) { return (d.getMonth() + 1) + '/' + d.getDate(); }
function monthLabelFromKey(key) { return Number(key.slice(5, 7)) + '월'; }
function formatWon(n) { return '₩' + Math.round(Number(n) || 0).toLocaleString(); }
let __partnerStatus = 'active';
function isPartnerSuspended() { return __partnerStatus === 'suspended'; }
function showSuspendedNotice() {
  let banner = document.getElementById('partner-suspended-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'partner-suspended-banner';
    banner.style.cssText = 'display:none;margin:0 0 18px;padding:14px 16px;border:1px solid rgba(255,77,106,.35);background:rgba(255,77,106,.10);color:#fff;border-radius:12px;font-size:14px;line-height:1.55;';
    const host = document.querySelector('.content') || document.querySelector('.main-content') || document.querySelector('.page');
    if (host) host.prepend(banner);
  }
  banner.innerHTML = '<b style="color:#FF4D6A;">계정이 정지되었습니다.</b> 조회는 가능하지만 링크 생성, 재발급, 삭제와 전환 적립은 중단됩니다. 관리자에게 문의해주세요.';
  banner.style.display = isPartnerSuspended() ? 'block' : 'none';
}
function blockIfSuspended() {
  if (window.__opAdminView) {
    alert('관리자 조회 모드에서는 회원 데이터를 변경할 수 없어요.');
    return true;
  }
  if (!isPartnerSuspended()) return false;
  showSuspendedNotice();
  alert('정지된 계정입니다. 링크 생성/재발급/삭제를 할 수 없어요.');
  return true;
}
function setActionButtonsForStatus() {
  const disabled = isPartnerSuspended();
  document.querySelectorAll('.catalog-getlink,.catalog-regen,.link-del-btn,#gen-btn').forEach(btn => {
    btn.disabled = disabled;
    if (disabled) {
      btn.style.opacity = '.45';
      btn.style.cursor = 'not-allowed';
      btn.title = '정지된 계정';
    }
  });
}
async function loadCampaignBanner() {
  if (!window.opClient) return;
  const today = todayKST();
  const { data, error } = await window.opClient.from('campaigns')
    .select('title,emoji,bonus_rate,starts_at,ends_at,target_type,target_value')
    .eq('is_active', true)
    .lte('starts_at', today)
    .gte('ends_at', today)
    .order('bonus_rate', { ascending: false });
  if (error) return;
  const campaigns = data || [];
  let banner = document.getElementById('campaign-active-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'campaign-active-banner';
    banner.style.cssText = 'display:none;margin:0 0 18px;padding:14px 16px;border:1px solid rgba(190,255,0,.28);background:linear-gradient(90deg,rgba(190,255,0,.16),rgba(190,255,0,.05));color:var(--text);border-radius:12px;font-size:14px;line-height:1.55;';
    const overview = document.getElementById('page-overview');
    const links = document.getElementById('page-links');
    if (overview) overview.prepend(banner);
    else if (links) links.prepend(banner);
  }
  if (!campaigns.length) { banner.style.display = 'none'; return; }
  banner.innerHTML = campaigns.slice(0, 3).map(c => {
    const icon = c.emoji || '🎁';
    const period = (c.starts_at && c.ends_at) ? ' <span style="color:var(--text2);font-weight:600;">(' + escHtml(fmtCampaignDate(c.starts_at)) + '~' + escHtml(fmtCampaignDate(c.ends_at)) + ')</span>' : '';
    return '<div style="color:var(--text);"><b style="color:var(--lime);">' + escHtml(icon + ' ' + c.title) + '</b> 대상 상품 추가 수수료 진행중' + period + '</div>';
  }).join('');
  banner.style.display = 'block';
}

async function loadAds() {
  const slider = document.getElementById('partner-ad-slider');
  if (!slider || !window.opClient) return;
  const { data, error } = await window.opClient.from('partner_ads')
    .select('id,tag,title,subtitle,cta_label,image_url,product_id,link_url,sort_order,starts_at,ends_at,is_active')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) {
    slider.style.display = 'none';
    return;
  }
  const now = Date.now();
  __adSlides = (data || []).filter(ad => {
    const startsOk = !ad.starts_at || new Date(ad.starts_at).getTime() <= now;
    const endsOk = !ad.ends_at || new Date(ad.ends_at).getTime() >= now;
    return startsOk && endsOk;
  }).sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
  renderAds();
}

function adHref(ad) {
  if (ad.product_id) return 'https://app.yuanfnb.com/shop/product/' + encodeURIComponent(ad.product_id);
  if (!ad.link_url) return '';
  try {
    const url = new URL(ad.link_url);
    return /^https?:$/.test(url.protocol) ? url.href : '';
  } catch (e) {
    return '';
  }
}

function renderAds() {
  const slider = document.getElementById('partner-ad-slider');
  const track = document.getElementById('partner-ad-track');
  const dots = document.getElementById('partner-ad-dots');
  if (!slider || !track || !dots) return;
  clearInterval(__adTimer);
  __adTimer = null;
  if (!__adSlides.length) {
    slider.style.display = 'none';
    track.innerHTML = '';
    dots.innerHTML = '';
    return;
  }
  if (__adIndex >= __adSlides.length) __adIndex = 0;
  track.innerHTML = __adSlides.map((ad, i) => {
    const href = adHref(ad);
    const cta = ad.cta_label || '자세히 보기';
    return '<article class="partner-ad-slide' + (i === __adIndex ? ' active' : '') + '" data-ad-index="' + i + '">' +
      '<div class="partner-ad-bg" style="background-image:url(\'' + escHtml(ad.image_url || '') + '\');"></div>' +
      '<div class="partner-ad-shade"></div>' +
      '<div class="partner-ad-content">' +
        '<div class="partner-ad-badge"><span></span> AD 추천 광고중</div>' +
        (ad.tag ? '<div class="partner-ad-tag">' + escHtml(ad.tag) + '</div>' : '') +
        '<h2>' + escHtml(ad.title || '온종일팜 추천 상품') + '</h2>' +
        (ad.subtitle ? '<p>' + escHtml(ad.subtitle) + '</p>' : '') +
        '<div class="partner-ad-actions">' +
          (href ? '<a class="partner-ad-cta" href="' + escHtml(href) + '" target="_blank" rel="noopener noreferrer">' + escHtml(cta) + ' →</a>' : '') +
          (ad.product_id ? '<button type="button" class="partner-ad-cta ghost" onclick="goGetLinkFromAd(\'' + escHtml(ad.product_id) + '\')">🔗 링크 받기</button>' : '') +
        '</div>' +
      '</div>' +
    '</article>';
  }).join('');
  dots.innerHTML = __adSlides.length > 1 ? __adSlides.map((ad, i) =>
    '<button type="button" class="' + (i === __adIndex ? 'active' : '') + '" aria-label="광고 ' + (i + 1) + '번 보기" onclick="goAdSlide(' + i + ')"></button>'
  ).join('') : '';
  slider.style.display = 'block';
  if (__adSlides.length > 1) {
    __adTimer = setInterval(function () { goAdSlide((__adIndex + 1) % __adSlides.length); }, 4000);
  }
}

// 광고 "링크 받기" → 내 링크 페이지로 이동 + 해당 상품으로 스크롤/강조
function goGetLinkFromAd(productId) {
  __adTargetProductId = String(productId || '');
  showPage('links');
}
let __adTargetProductId = '';

function goAdSlide(index) {
  if (!__adSlides.length) return;
  __adIndex = ((index % __adSlides.length) + __adSlides.length) % __adSlides.length;
  renderAds();
}

function buildEmptyDailySeries(days) {
  const today = new Date();
  const labels = [];
  const keys = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    labels.push(dayLabel(d));
    keys.push(dateKey(d));
  }
  return { labels, keys, values: new Array(days).fill(0), hasData: false };
}

function buildDailySeries(convs, days) {
  const series = buildEmptyDailySeries(days);
  const byDay = {};
  series.keys.forEach(k => { byDay[k] = 0; });
  convs.forEach(c => {
    if (c.status === 'canceled' || !c.created_at) return;
    const key = dateKey(new Date(c.created_at));
    if (Object.prototype.hasOwnProperty.call(byDay, key)) {
      byDay[key] += Number(c.commission_amount || 0);
    }
  });
  series.values = series.keys.map(k => byDay[k] || 0);
  series.hasData = series.values.some(v => v > 0);
  return series;
}

function setChartEmpty(show) {
  const svg = document.getElementById('earnings-chart');
  if (!svg) return;
  let empty = document.getElementById('earnings-chart-empty');
  if (!empty) {
    empty = document.createElement('div');
    empty.id = 'earnings-chart-empty';
    empty.className = 'chart-empty';
    empty.innerHTML = '<div class="chart-empty-icon">📈</div><div>아직 수익 데이터가 없어요</div>';
    svg.insertAdjacentElement('afterend', empty);
  }
  empty.style.display = show ? 'block' : 'none';
  svg.style.display = '';
}

function applyOverviewChartData(convs) {
  chartData = {
    '7d': buildDailySeries(convs, 7),
    '1m': buildDailySeries(convs, 30),
    '3m': buildDailySeries(convs, 90)
  };
  const active = document.querySelector('#page-overview .period-btn.active[data-range]')?.dataset.range || '7d';
  updateChart(active);
}

function updateChart(range) {
  const data = chartData[range];
  if (!data) return;
  const svg = document.getElementById('earnings-chart');
  if (!svg) return;
  setChartEmpty(!data.hasData);

  const W = 580, H = 140, PAD = { top: 10, right: 10, bottom: 28, left: 10 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const max = Math.max(...data.values, 0);
  const min = max ? Math.min(...data.values) * 0.8 : 0;
  const range_v = max - min || 1;
  const denom = Math.max(data.values.length - 1, 1);

  const points = data.values.map((v, i) => ({
    x: PAD.left + (i / denom) * chartW,
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
        fill="${i === points.length-1 ? 'var(--lime)' : 'var(--dark3)'}"
        stroke="var(--lime)" stroke-width="1.5"
        data-val="${p.v.toLocaleString()}" data-label="${data.labels[i]}"/>`
    ).join('');
  }

  // 레이블
  const labelsG = svg.querySelector('.chart-x-labels');
  if (labelsG) {
    const labelStep = data.labels.length <= 10 ? 1 : Math.ceil(data.labels.length / 7);
    labelsG.innerHTML = data.labels.map((l, i) => {
      if (i % labelStep !== 0 && i !== data.labels.length - 1) return '';
      const x = PAD.left + (i / Math.max(data.labels.length - 1, 1)) * chartW;
      return `<text x="${x.toFixed(1)}" y="${H}" text-anchor="middle" fill="rgba(255,255,255,0.28)" font-size="10" font-family="inherit">${escHtml(l)}</text>`;
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
let __catalogCategories = [];
let __catalogCategory = 'all';
let __catalogSort = 'latest';
let __catalogCampOnly = false;
let __catalogVisible = 12;
const CATALOG_PAGE_SIZE = 12;
function clampCatalogRate(v, fallback, max) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, max);
}
function getCatalogCampaignBonus(product, campaigns, productCampaignRates) {
  let bonusRate = 0;
  let endsAt = '';
  (campaigns || []).forEach(function (c) {
    const targetType = c.target_type || 'all';
    const targetValue = c.target_value == null ? '' : String(c.target_value);
    const campaignId = String(c.id || '');
    const productCampaignKey = campaignId + ':' + String(product.id);
    const hasProductRate = Object.prototype.hasOwnProperty.call(productCampaignRates, productCampaignKey);
    const productCategory = product.category_id == null ? '' : String(product.category_id);
    const matches = targetType === 'all' ||
      (targetType === 'product' && campaignId && hasProductRate) ||
      (targetType === 'category' && productCategory && (targetValue === productCategory || targetValue === String(product.categoryName || '')));
    if (matches) {
      const productBonus = targetType === 'product' ? productCampaignRates[productCampaignKey] : null;
      const rawBonus = productBonus == null ? c.bonus_rate : productBonus;
      const b = clampCatalogRate(rawBonus, 0, 0.30);
      if (b >= bonusRate) { bonusRate = b; if (c.ends_at) endsAt = String(c.ends_at); }
    }
  });
  return { rate: bonusRate, endsAt: endsAt };
}
async function loadCatalog() {
  const grid = document.getElementById('catalog-grid');
  if (!grid || !window.opClient) return;
  const today = todayKST();
  const uid = await currentUid();
  const [prodRes, commRes, linkRes, catRes, campRes, cpRes] = await Promise.all([
    window.opClient.from('products').select('id,name,retail_price,image_url,unit,category_id').eq('is_active', true).order('created_at', { ascending: false }),
    window.opClient.from('product_commissions').select('product_id,commission_rate'),
    window.opClient.from('partner_links').select('code,product_id').eq('partner_id', uid || '00000000-0000-0000-0000-000000000000'),
    window.opClient.from('categories').select('id,name,sort_order').order('sort_order', { ascending: true }),
    window.opClient.from('campaigns')
      .select('id,bonus_rate,target_type,target_value,ends_at')
      .eq('is_active', true)
      .lte('starts_at', today)
      .gte('ends_at', today),
    window.opClient.from('campaign_products').select('campaign_id,product_id,bonus_rate')
  ]);
  if (prodRes.error) { grid.innerHTML = '<div class="catalog-empty">상품을 불러오지 못했어요.</div>'; return; }
  const rateMap = {};
  (commRes.data || []).forEach(c => { rateMap[c.product_id] = Number(c.commission_rate); });
  const myCodeMap = {};
  (linkRes.data || []).forEach(l => { if (l.product_id) myCodeMap[l.product_id] = l.code; });
  const categoryMap = {};
  __catalogCategories = catRes.error ? [] : (catRes.data || []);
  __catalogCategories.forEach(c => { categoryMap[String(c.id)] = c.name; });
  const campaigns = campRes.error ? [] : (campRes.data || []);
  const productCampaignRates = {};
  if (!cpRes.error) {
    (cpRes.data || []).forEach(r => {
      productCampaignRates[String(r.campaign_id) + ':' + String(r.product_id)] = r.bonus_rate;
    });
  }
  __catalog = (prodRes.data || []).map(p => {
    const product = Object.assign({}, p, {
      baseRate: clampCatalogRate(rateMap[p.id] != null ? rateMap[p.id] : (Number(__appSettings.default_commission_rate) / 100), Number(__appSettings.default_commission_rate) / 100, 0.30),
      myCode: myCodeMap[p.id] || null,
      categoryName: categoryMap[String(p.category_id)] || ''
    });
    const camp = getCatalogCampaignBonus(product, campaigns, productCampaignRates);
    product.campaignBonusRate = camp.rate;
    product.campaignEndsAt = camp.endsAt;
    product.rate = Math.min(product.baseRate + product.campaignBonusRate, 0.60);
    return product;
  });
  renderCatalogFilters();
  renderCatalog();
}
function getCatalogFilteredList() {
  const searchEl = document.getElementById('catalog-search');
  const q = (searchEl?.value || '').trim().toLowerCase();
  const list = __catalog.filter(function (p) {
    const matchesCategory = __catalogCategory === 'all' || String(p.category_id || '') === __catalogCategory;
    const matchesSearch = !q || (p.name || '').toLowerCase().includes(q);
    const matchesCamp = !__catalogCampOnly || Number(p.campaignBonusRate || 0) > 0;
    return matchesCategory && matchesSearch && matchesCamp;
  });
  return sortCatalogList(list);
}
function sortCatalogList(list) {
  const arr = list.slice();
  const price = function (p) { return Number(p.retail_price) || 0; };
  const rate = function (p) { return Number(p.rate) || 0; };
  switch (__catalogSort) {
    case 'earn_high': arr.sort(function (a, b) { return price(b) * rate(b) - price(a) * rate(a); }); break;
    case 'rate_high': arr.sort(function (a, b) { return rate(b) - rate(a); }); break;
    case 'price_low': arr.sort(function (a, b) { return price(a) - price(b); }); break;
    case 'price_high': arr.sort(function (a, b) { return price(b) - price(a); }); break;
    // 'latest'는 __catalog 원본 순서(created_at desc) 유지
  }
  return arr;
}
function renderCatalogFilters() {
  const wrap = document.getElementById('catalog-filters');
  if (!wrap) return;
  const used = {};
  __catalog.forEach(p => { if (p.category_id) used[String(p.category_id)] = true; });
  const cats = __catalogCategories.filter(c => used[String(c.id)]);
  if (__catalogCategory !== 'all' && !used[__catalogCategory]) __catalogCategory = 'all';
  wrap.innerHTML = '<button class="catalog-filter-chip' + (__catalogCategory === 'all' ? ' active' : '') + '" type="button" data-category="all">전체</button>' +
    cats.map(c => '<button class="catalog-filter-chip' + (__catalogCategory === String(c.id) ? ' active' : '') + '" type="button" data-category="' + escHtml(c.id) + '">' + escHtml(c.name) + '</button>').join('');
}
function renderCatalog() {
  const grid = document.getElementById('catalog-grid');
  if (!grid) return;
  const list = getCatalogFilteredList();
  const visibleList = list.slice(0, __catalogVisible);
  const cnt = document.getElementById('catalog-count');
  if (cnt) cnt.textContent = list.length === __catalog.length ? '(' + __catalog.length + ')' : '(' + list.length + '/' + __catalog.length + ')';
  if (!list.length) {
    grid.innerHTML = '<div class="catalog-empty">상품이 없어요.</div>';
    updateCatalogMore(list.length);
    return;
  }
  const suspended = isPartnerSuspended();
  grid.innerHTML = visibleList.map(function (p) {
    const price = Number(p.retail_price) || 0;
    const earn = Math.round(price * p.rate);
    const basePct = Math.round((Number(p.baseRate) || 0) * 1000) / 10;
    const ratePct = Math.round((Number(p.rate) || 0) * 1000) / 10;
    const bonusPct = Math.round((Number(p.campaignBonusRate) || 0) * 1000) / 10;
    const hasCampaignBonus = bonusPct > 0;
    const img = resolveFarmImg(p.image_url);
    return '<div class="catalog-card" data-pid="' + escHtml(p.id) + '">' +
      '<div class="catalog-img" data-view-product="' + escHtml(p.id) + '" title="상품 상세 보기" style="' + (img ? "background-image:url('" + escHtml(img) + "')" : '') + '">' + (img ? '' : '🛒') + '</div>' +
      '<div class="catalog-info">' +
        '<div class="catalog-name">' + escHtml(p.name) + '</div>' +
        (p.categoryName ? '<div class="catalog-category">' + escHtml(p.categoryName) + '</div>' : '') +
        (hasCampaignBonus ? '<div class="catalog-campaign-badge">🎁 캠페인 +' + escHtml(String(bonusPct).replace(/\.0$/, '')) + '%' + (p.campaignEndsAt ? '<span class="catalog-campaign-until">~' + escHtml(fmtCampaignDate(p.campaignEndsAt)) + '까지</span>' : '') + '</div>' : '') +
        '<div class="catalog-price">₩' + price.toLocaleString() + '<span>/' + escHtml(p.unit || '개') + '</span></div>' +
        '<div class="catalog-earn">' + (hasCampaignBonus ? '내 예상 수익' : '내 수익') + ' <b>₩' + earn.toLocaleString() + '</b><span class="catalog-rate' + (hasCampaignBonus ? ' boosted' : '') + '">' +
          (hasCampaignBonus ? escHtml(String(basePct).replace(/\.0$/, '')) + '% → ' + escHtml(String(ratePct).replace(/\.0$/, '')) + '% <em>▲+' + escHtml(String(bonusPct).replace(/\.0$/, '')) + '%</em>' : escHtml(String(ratePct).replace(/\.0$/, '')) + '%') +
        '</span></div>' +
        '<div class="catalog-viewrow">' +
          '<button class="catalog-view" data-view-product="' + escHtml(p.id) + '" type="button">🔍 상세 보기</button>' +
          '<button class="catalog-detail-dl" data-detail="' + escHtml(p.id) + '" data-detail-name="' + escHtml(p.name) + '" type="button">📄 상세페이지 저장</button>' +
        '</div>' +
        (p.myCode
          ? '<div class="catalog-mylink"><span title="partner.yuanfnb.com/r/' + p.myCode + '">🔗 partner.yuanfnb.com/r/' + escHtml(p.myCode) + '</span><button class="catalog-copy" data-code="' + escHtml(p.myCode) + '">복사</button></div>' +
            '<div class="catalog-btnrow">' +
              '<button class="catalog-banner" data-banner="' + escHtml(p.id) + '" type="button">🖼 배너 만들기</button>' +
              '<button class="catalog-regen" data-id="' + escHtml(p.id) + '"' + (suspended ? ' disabled title="정지된 계정" style="opacity:.45;cursor:not-allowed;"' : '') + '>🔄 재발급</button>' +
            '</div>'
          : '<button class="catalog-getlink btn-primary" data-id="' + escHtml(p.id) + '"' + (suspended ? ' disabled title="정지된 계정" style="opacity:.45;cursor:not-allowed;"' : '') + '>🔗 이 상품 링크 만들기</button>') +
      '</div>' +
    '</div>';
  }).join('');
  updateCatalogMore(list.length);
  setActionButtonsForStatus();
  // 광고 "링크 받기"로 넘어온 경우 → 해당 상품 카드로 스크롤+강조
  if (__adTargetProductId) {
    const pid = __adTargetProductId;
    __adTargetProductId = '';
    setTimeout(function () {
      const card = grid.querySelector('.catalog-card[data-pid="' + (window.CSS && CSS.escape ? CSS.escape(pid) : pid) + '"]');
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('catalog-card-highlight');
        // "👉 이 상품이에요!" 플로팅 배지로 확실히 티나게
        const existing = card.querySelector('.ad-here-badge');
        if (existing) existing.remove();
        const badge = document.createElement('div');
        badge.className = 'ad-here-badge';
        badge.textContent = '👉 이 상품이에요!';
        card.appendChild(badge);
        setTimeout(function () {
          card.classList.remove('catalog-card-highlight');
          badge.remove();
        }, 3200);
      }
    }, 120);
  }
}
function updateCatalogMore(total) {
  const btn = document.getElementById('catalog-more');
  if (!btn) return;
  const remains = Math.max(total - __catalogVisible, 0);
  btn.style.display = remains > 0 ? 'inline-flex' : 'none';
  btn.textContent = remains > 0 ? '더 보기 (' + remains.toLocaleString() + ')' : '더 보기';
}
document.getElementById('catalog-search')?.addEventListener('input', function () {
  __catalogVisible = CATALOG_PAGE_SIZE;
  renderCatalog();
});
document.getElementById('catalog-filters')?.addEventListener('click', function (e) {
  const btn = e.target.closest('.catalog-filter-chip');
  if (!btn) return;
  __catalogCategory = btn.dataset.category || 'all';
  __catalogVisible = CATALOG_PAGE_SIZE;
  renderCatalogFilters();
  renderCatalog();
});
document.getElementById('catalog-more')?.addEventListener('click', function () {
  __catalogVisible += CATALOG_PAGE_SIZE;
  renderCatalog();
});
document.getElementById('catalog-sort')?.addEventListener('change', function () {
  __catalogSort = this.value || 'latest';
  __catalogVisible = CATALOG_PAGE_SIZE;
  renderCatalog();
});
document.getElementById('catalog-camp-only')?.addEventListener('change', function () {
  __catalogCampOnly = this.checked;
  __catalogVisible = CATALOG_PAGE_SIZE;
  renderCatalog();
});
document.getElementById('catalog-grid')?.addEventListener('click', async function (e) {
  // 상품 상세 보기 (이미지/버튼) → 온종일팜 실제 상품 페이지 새 탭
  const viewEl = e.target.closest('[data-view-product]');
  if (viewEl) {
    window.open('https://app.yuanfnb.com/shop/product/' + encodeURIComponent(viewEl.dataset.viewProduct), '_blank', 'noopener');
    return;
  }
  // 배너 만들기
  const bannerBtn = e.target.closest('[data-banner]');
  if (bannerBtn) {
    if (blockIfSuspended()) return;
    openBannerModal(bannerBtn.dataset.banner);
    return;
  }
  // 상세페이지 저장(워터마크 얹어 다운로드)
  const detailBtn = e.target.closest('[data-detail]');
  if (detailBtn) {
    downloadDetailPage(detailBtn.dataset.detail, detailBtn.dataset.detailName, detailBtn);
    return;
  }
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
  if (blockIfSuspended()) return;
  const p = __catalog.find(x => x.id === btn.dataset.id);
  if (!p || !window.opClient) return;
  if (regenBtn && !confirm('🔄 이 상품의 링크를 새로 발급할까요?\n\n⚠️ 이미 블로그·인스타·카톡 등에 올린 이전 링크가 있으면, 그 게시물의 링크도 전부 작동을 멈춰요.\n(그 링크로 들어오는 사람은 추적·수익이 안 생겨요)\n\n✅ 지금까지 쌓인 클릭·수익 실적은 그대로 유지돼요.\n\n계속할까요?')) return;

  const t = btn.textContent; btn.disabled = true; btn.textContent = regenBtn ? '재발급 중...' : '생성 중...';
  const { data: { user } } = await window.opClient.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return; }
  const { data: prof } = await window.opClient.from('partners').select('nickname').eq('id', user.id).maybeSingle();
  // 추천코드는 partner_links.code UNIQUE 제약으로 고유 보장. 극히 드문 충돌(23505) 시 새 코드로 자동 재발급.
  let error, code;
  for (let attempt = 0; attempt < 4; attempt++) {
    code = makeRefCode(prof && prof.nickname);
    let r;
    if (regenBtn) {
      r = await window.opClient.from('partner_links').update({ code: code }).eq('partner_id', user.id).eq('product_id', p.id);
    } else {
      r = await window.opClient.from('partner_links').insert({
        partner_id: user.id, code: code,
        product_url: 'https://app.yuanfnb.com/shop/product/' + p.id,
        product_id: p.id, product_name: p.name, product_image: resolveFarmImg(p.image_url) || null,
        product_price: Number(p.retail_price) || 0, commission_rate: p.rate, title: p.name
      });
    }
    error = r.error;
    if (!error || error.code !== '23505') break; // 성공 or 코드충돌 외 에러 → 중단
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
  const uid = await currentUid();
  if (!uid) return;
  const tbody = document.querySelector('#links-table tbody');
  const titleEl = document.querySelector('#page-links .table-title');
  const [linkRes, convRes] = await Promise.all([
    window.opClient.from('partner_links')
      .select('id,code,product_url,title,clicks,conversions,created_at')
      .eq('partner_id', uid)
      .order('created_at', { ascending: false }),
    window.opClient.from('conversions').select('link_id,commission_amount,status').eq('partner_id', uid)
  ]);
  const data = linkRes.data || [];
  if (linkRes.error) { console.warn('[온파트너] 링크 조회 오류:', linkRes.error.message); return; }
  const earningsByLink = {};
  const convCountByLink = {};
  (convRes.data || []).forEach(c => {
    if (c.status === 'canceled' || !c.link_id) return;
    earningsByLink[c.link_id] = (earningsByLink[c.link_id] || 0) + Number(c.commission_amount || 0);
    convCountByLink[c.link_id] = (convCountByLink[c.link_id] || 0) + 1;
  });
  if (titleEl) titleEl.textContent = '전체 링크 (' + data.length + ')';
  const mineTabCount = document.getElementById('mine-link-tab-count');
  if (mineTabCount) mineTabCount.textContent = '(' + data.length + ')';
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
      '<td data-label="링크명"><div class="td-link">' + escHtml(name) + '</div></td>' +
      '<td data-label="파트너 URL"><div class="td-url" title="' + escHtml(purl) + '">' + escHtml(purl) + '</div></td>' +
      '<td data-label="쇼핑몰"><div class="td-url">' + escHtml(shop) + '</div></td>' +
      '<td data-label="클릭" class="td-num">' + (l.clicks || 0) + '</td>' +
      '<td data-label="전환" class="td-num">' + (convCountByLink[l.id] || 0) + '</td>' +
      '<td data-label="수익" class="td-earn">' + formatWon(earningsByLink[l.id]) + '</td>' +
      '<td data-label="생성일" style="font-size:12px;color:var(--text3)">' + date + '</td>' +
      '<td data-label="상태"><span class="status-pill active"><span class="live-dot"></span>활성</span></td>' +
      '<td data-label="관리" style="text-align:right;"><div class="issued-link-actions"><button class="issued-copy-btn" onclick="copyIssuedLink(\'' + escHtml(l.code) + '\',this)">📋 링크 복사</button><button class="link-del-btn" onclick="deleteLink(\'' + escHtml(l.code) + '\',this)" title="' + (isPartnerSuspended() ? '정지된 계정' : '링크 삭제') + '"' + (isPartnerSuspended() ? ' disabled style="opacity:.45;cursor:not-allowed;"' : '') + '>🗑 삭제</button></div></td>' +
      '</tr>';
  }).join('');
  setActionButtonsForStatus();
}

function copyIssuedLink(code, btn) {
  const url = 'https://partner.yuanfnb.com/r/' + code;
  navigator.clipboard?.writeText(url).then(function () {
    const original = btn.textContent; btn.textContent = '✓ 복사됨';
    setTimeout(function () { btn.textContent = original; }, 1300);
  }).catch(function () { prompt('아래 링크를 복사해주세요.', url); });
}

// ── 링크 삭제
async function deleteLink(code, btn) {
  if (!window.opClient) return;
  if (blockIfSuspended()) return;
  if (!confirm('이 링크를 삭제할까요?\n삭제하면 이 링크로는 더 이상 클릭·구매가 추적되지 않아요.')) return;
  const uid = await currentUid();
  if (!uid) return;
  btn.disabled = true; const t = btn.textContent; btn.textContent = '삭제 중...';
  const { data, error } = await window.opClient.from('partner_links').delete().eq('code', code).eq('partner_id', uid).select('id');
  if (error) {
    btn.disabled = false; btn.textContent = t;
    // FK 제약(전환 실적 연결) 등으로 삭제가 막힌 경우 안내 (PostgREST FK 위반 코드)
    if (error.code === '23503') {
      alert('이 링크는 판매·수익 실적이 연결돼 있어 삭제할 수 없어요.\n수익·정산 이력 보존을 위한 제한이에요.');
    } else {
      alert('삭제 실패: ' + error.message);
    }
    return;
  }
  if (!data || !data.length) {
    // 에러는 없지만 지워진 행이 없음 = 이미 삭제됐거나 내 소유가 아닌 링크
    btn.disabled = false; btn.textContent = t;
    alert('이 링크는 삭제되지 않았어요.\n이미 삭제됐거나 내 링크가 아닐 수 있어요.');
    return;
  }
  loadLinks();      // 목록·배지 갱신
  loadCatalog();    // 카탈로그 '링크 받기' 상태 복구
}
function escHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
// 전역 설정(op_settings) — 관리자가 정한 기본 수수료율·최소출금·정산안내·쿠키기간
let __appSettings = { default_commission_rate: 5, min_withdrawal: 10000, settlement_notice: '매월 15일 정산 (전월 확정 수수료 기준)', cookie_days: 30 };
async function loadAppSettings() {
  if (!window.opClient) return;
  try {
    const { data, error } = await window.opClient.from('op_settings').select('key,value');
    if (error || !data) return;
    data.forEach(function (r) {
      if (r.key === 'settlement_notice') { __appSettings.settlement_notice = r.value; }
      else { const n = Number(r.value); if (!isNaN(n)) __appSettings[r.key] = n; }
    });
  } catch (e) {}
}
// 현재 로그인 사용자 id — "내 대시보드" 조회를 본인 것으로 한정(관리자 계정이면 RLS상 전체가 보이므로 명시 필터 필수)
async function currentUid() {
  try {
    if (window.__opDashboardReady) await window.__opDashboardReady;
    if (window.__opAdminView) return window.__opAdminView.partnerId;
    const { data } = await window.opClient.auth.getUser(); return data && data.user ? data.user.id : null;
  }
  catch (e) { return null; }
}
// 온종일팜 상품 이미지 URL 정규화: 상대경로(/products/x.jpg)는 온종일팜 도메인을 붙여 절대 URL로.
function resolveFarmImg(u) {
  if (!u || typeof u !== 'string') return '';
  u = u.trim();
  if (/^https?:\/\//.test(u)) return u;          // 이미 절대 URL
  if (u.charAt(0) === '/') return 'https://app.yuanfnb.com' + u;  // 온종일팜 도메인 기준 상대경로
  return '';
}

// ───────── 홍보 배너 생성기 ─────────
let __bannerProduct = null;
let __bannerRatio = 'square';

function openBannerModal(productId) {
  const p = (__catalog || []).find(x => String(x.id) === String(productId));
  if (!p) return;
  __bannerProduct = p;
  __bannerRatio = 'square';
  document.querySelectorAll('#banner-ratios .banner-ratio').forEach(b => b.classList.toggle('active', b.dataset.ratio === 'square'));
  const ov = document.getElementById('banner-modal');
  if (ov) { ov.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
  const ta = document.getElementById('banner-text');
  if (ta) ta.value = buildBannerText(p);
  renderBanner();
}
function closeBannerModal() {
  const ov = document.getElementById('banner-modal');
  if (ov) { ov.style.display = 'none'; document.body.style.overflow = ''; }
  __bannerProduct = null;
}
function buildBannerText(p) {
  const price = (Number(p.retail_price) || 0).toLocaleString();
  const url = 'partner.yuanfnb.com/r/' + (p.myCode || '');
  return '🍊 ' + p.name + '\n💰 ' + price + '원 · 산지직송\n\n온종일팜에서 신선하게 만나보세요 👇\n' + url;
}
function loadBannerImg(src) {
  return new Promise(function (resolve) {
    if (!src) { resolve(null); return; }
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = function () { resolve(im); };
    im.onerror = function () { resolve(null); };
    im.src = src;
  });
}
function bannerCover(ctx, img, x, y, w, h) {
  const ir = img.width / img.height, r = w / h;
  let sw, sh, sx, sy;
  if (ir > r) { sh = img.height; sw = sh * r; sx = (img.width - sw) / 2; sy = 0; }
  else { sw = img.width; sh = sw / r; sx = 0; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}
function bannerRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
// 상품 이미지 코너에 은은한 워터마크 (다운로드되는 모든 배너 공통)
function bannerWatermark(ctx, rightX, bottomY) {
  const label = '온파트너';
  const fs = 26;
  ctx.font = '800 ' + fs + 'px Pretendard, sans-serif';
  ctx.textAlign = 'left';
  const dotR = 5, gap = 10;
  const tw = ctx.measureText(label).width;
  const padX = 18, padY = 11;
  const h = fs + padY * 2;
  const w = padX + dotR * 2 + gap + tw + padX;
  const x = rightX - w - 22, y = bottomY - h - 22;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.38)';
  bannerRoundRect(ctx, x, y, w, h, h / 2); ctx.fill();
  const cy = y + h / 2;
  ctx.fillStyle = '#BEFF00';
  ctx.beginPath(); ctx.arc(x + padX + dotR, cy, dotR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.95)';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + padX + dotR * 2 + gap, cy + 1);
  ctx.restore();
}
function bannerWrap(ctx, text, maxW, maxLines) {
  const chars = String(text).split('');
  const lines = [];
  let line = '';
  for (let i = 0; i < chars.length; i++) {
    const test = line + chars[i];
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = chars[i]; }
    else { line = test; }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1) + '…'; }
  return lines;
}
async function renderBanner() {
  const p = __bannerProduct;
  const cv = document.getElementById('banner-canvas');
  if (!p || !cv) return;
  const loading = document.getElementById('banner-loading');
  if (loading) loading.style.display = 'flex';
  try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
  const square = __bannerRatio === 'square';
  const W = square ? 1080 : 1200;
  const H = square ? 1080 : 630;
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = '#0b0b0b';
  ctx.fillRect(0, 0, W, H);
  const img = await loadBannerImg(resolveFarmImg(p.image_url));
  const lime = '#BEFF00';
  const price = (Number(p.retail_price) || 0).toLocaleString();
  if (square) {
    const imgH = 700;
    if (img) bannerCover(ctx, img, 0, 0, W, imgH);
    else { ctx.fillStyle = '#151515'; ctx.fillRect(0, 0, W, imgH); ctx.textAlign = 'center'; ctx.font = '120px sans-serif'; ctx.fillStyle = '#333'; ctx.fillText('🛒', W / 2, imgH / 2 + 40); }
    const g = ctx.createLinearGradient(0, imgH - 140, 0, imgH);
    g.addColorStop(0, 'rgba(11,11,11,0)'); g.addColorStop(1, '#0b0b0b');
    ctx.fillStyle = g; ctx.fillRect(0, imgH - 140, W, 140);
    const px = 64; let cy = imgH + 56;
    ctx.textAlign = 'left';
    ctx.fillStyle = lime; ctx.font = '700 26px Pretendard, sans-serif';
    ctx.fillText('● 온종일팜 공식 파트너', px, cy); cy += 62;
    ctx.fillStyle = '#fff'; ctx.font = '800 58px Pretendard, sans-serif';
    bannerWrap(ctx, p.name, W - px * 2, 2).forEach(function (ln) { ctx.fillText(ln, px, cy); cy += 70; });
    cy += 14;
    ctx.fillStyle = lime; ctx.font = '900 78px Pretendard, sans-serif';
    ctx.fillText(price + '원', px, cy);
    const btnW = 360, btnH = 92, btnX = W - px - btnW, btnY = H - 60 - btnH;
    ctx.fillStyle = lime; bannerRoundRect(ctx, btnX, btnY, btnW, btnH, 46); ctx.fill();
    ctx.fillStyle = '#0b0b0b'; ctx.font = '800 34px Pretendard, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('지금 구매하기 →', btnX + btnW / 2, btnY + btnH / 2 + 12);
    bannerWatermark(ctx, W, imgH);
  } else {
    const imgW = 630;
    if (img) bannerCover(ctx, img, 0, 0, imgW, H);
    else { ctx.fillStyle = '#151515'; ctx.fillRect(0, 0, imgW, H); }
    const px = imgW + 56, rw = W - px - 56; let cy = 128;
    ctx.textAlign = 'left';
    ctx.fillStyle = lime; ctx.font = '700 24px Pretendard, sans-serif';
    ctx.fillText('● 온종일팜 공식 파트너', px, cy); cy += 56;
    ctx.fillStyle = '#fff'; ctx.font = '800 52px Pretendard, sans-serif';
    bannerWrap(ctx, p.name, rw, 3).forEach(function (ln) { ctx.fillText(ln, px, cy); cy += 64; });
    cy += 18;
    ctx.fillStyle = lime; ctx.font = '900 68px Pretendard, sans-serif';
    ctx.fillText(price + '원', px, cy);
    const btnW = 320, btnH = 82, btnX = px, btnY = H - 116;
    ctx.fillStyle = lime; bannerRoundRect(ctx, btnX, btnY, btnW, btnH, 41); ctx.fill();
    ctx.fillStyle = '#0b0b0b'; ctx.font = '800 32px Pretendard, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('지금 구매하기 →', btnX + btnW / 2, btnY + btnH / 2 + 11);
    bannerWatermark(ctx, imgW, H);
  }
  if (loading) loading.style.display = 'none';
}
function setBannerRatio(ratio) {
  __bannerRatio = ratio;
  document.querySelectorAll('#banner-ratios .banner-ratio').forEach(b => b.classList.toggle('active', b.dataset.ratio === ratio));
  renderBanner();
}
function saveBannerImage() {
  const cv = document.getElementById('banner-canvas');
  const p = __bannerProduct;
  if (!cv || !p) return;
  cv.toBlob(function (blob) {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safe = String(p.name).replace(/[^\w가-힣]+/g, '_').slice(0, 30) || 'banner';
    a.href = url; a.download = '온파트너_' + safe + '_' + __bannerRatio + '.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }, 'image/png');
}
function copyBannerText() {
  const ta = document.getElementById('banner-text');
  const btn = document.getElementById('banner-copy');
  if (!ta) return;
  const done = function () { if (btn) { const o = btn.textContent; btn.textContent = '복사됨!'; setTimeout(function () { btn.textContent = o; }, 1400); } };
  if (navigator.clipboard) navigator.clipboard.writeText(ta.value).then(done).catch(function () { ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} });
  else { ta.select(); try { document.execCommand('copy'); done(); } catch (e) {} }
}
document.getElementById('banner-x')?.addEventListener('click', closeBannerModal);
document.getElementById('banner-modal')?.addEventListener('click', function (e) { if (e.target === this) closeBannerModal(); });
document.getElementById('banner-save')?.addEventListener('click', saveBannerImage);
document.getElementById('banner-copy')?.addEventListener('click', copyBannerText);
document.getElementById('banner-ratios')?.addEventListener('click', function (e) {
  const b = e.target.closest('.banner-ratio'); if (b) setBannerRatio(b.dataset.ratio);
});

// ───────── 상세페이지 저장 (온종일팜 상세페이지 이미지 + 유출방지 워터마크 타일) ─────────
// 이미지 전체에 대각선으로 반복되는 워터마크를 얹어 무단 재배포를 억제
function drawDetailWatermark(ctx, W, H) {
  ctx.save();
  const text = '온파트너  ·  partner.yuanfnb.com';
  const fs = Math.max(20, Math.round(W / 24));
  ctx.font = '800 ' + fs + 'px Pretendard, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.rotate(-Math.PI / 6);                 // 좌표계 -30도 회전
  const diag = Math.sqrt(W * W + H * H);
  const stepX = fs * 17;
  const stepY = fs * 8;
  ctx.lineWidth = Math.max(2, fs / 12);
  for (let y = -diag; y < diag; y += stepY) {
    for (let x = -diag; x < diag; x += stepX) {
      ctx.strokeStyle = 'rgba(0,0,0,0.16)';   // 밝은 배경에서도 보이는 외곽선
      ctx.strokeText(text, x, y);
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.fillText(text, x, y);
    }
  }
  ctx.restore();
}
async function downloadDetailPage(productId, name, btn) {
  if (!window.opClient) return;
  const orig = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = '준비 중...'; }
  try {
    const { data, error } = await window.opClient.from('products').select('description').eq('id', productId).maybeSingle();
    if (error) throw new Error('상품 정보를 불러오지 못했어요.');
    const desc = (data && data.description) || '';
    const m = desc.match(/src="(data:image\/[^"]+)"/);
    if (!m) { alert('이 상품은 저장할 상세페이지가 아직 없어요.'); return; }
    const img = await loadBannerImg(m[1]);
    if (!img) throw new Error('상세페이지 이미지를 불러오지 못했어요.');
    const cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);
    drawDetailWatermark(ctx, cv.width, cv.height);
    await new Promise(function (resolve) {
      cv.toBlob(function (blob) {
        if (!blob) { alert('저장에 실패했어요. 다시 시도해 주세요.'); resolve(); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const safe = String(name || '상품').replace(/[^\w가-힣]+/g, '_').slice(0, 30) || '상품';
        a.href = url; a.download = '온파트너_상세페이지_' + safe + '.jpg';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
        resolve();
      }, 'image/jpeg', 0.9);
    });
  } catch (e) {
    alert((e && e.message) || '상세페이지 저장 중 문제가 생겼어요.');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = orig; }
  }
}

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
  const uid = await currentUid();
  if (!uid) return;
  const { data: { user } } = await window.opClient.auth.getUser();
  const [{ data: p }, { count }] = await Promise.all([
    window.opClient.from('partners').select('name,nickname,status').eq('id', uid).maybeSingle(),
    window.opClient.from('partner_links').select('id', { count: 'exact', head: true }).eq('partner_id', uid)
  ]);
  __partnerStatus = (p && p.status) || 'active';
  showSuspendedNotice();
  setActionButtonsForStatus();
  const m = (user && user.user_metadata) || {};
  const name = (p && p.name) || m.name;
  const nick = (p && p.nickname) || m.nickname;
  const display = name || nick || '파트너';
  const nameEl = document.querySelector('.user-name');
  const avEl = document.querySelector('.user-avatar');
  const gradeEl = document.querySelector('.user-grade');
  if (nameEl) nameEl.textContent = display;
  if (avEl) avEl.textContent = display.slice(0, 1);
  if (gradeEl) gradeEl.textContent = nick ? '@' + nick : '파트너 계정';
  setLinkBadge(count || 0);
}
function setLinkBadge(n) {
  const lb = document.getElementById('link-count-badge');
  if (lb) { lb.textContent = n; lb.style.display = n ? '' : 'none'; }
}

function setNotificationBadge(n) {
  const badge = document.getElementById('notification-badge');
  if (badge) {
    badge.textContent = n > 99 ? '99+' : String(n);
    badge.style.display = n ? '' : 'none';
  }
  // 상단 벨 배지도 함께 갱신 (사이드바 메뉴와 연동)
  const top = document.getElementById('topbar-notif-badge');
  if (top) top.style.display = n ? '' : 'none';
}

async function loadNotificationBadge() {
  if (!window.opClient) return;
  const uid = await currentUid();
  if (!uid) return;
  const { count, error } = await window.opClient
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('partner_id', uid)
    .eq('is_read', false);
  if (!error) setNotificationBadge(count || 0);
}

// ── 준실시간 알림(폴링): 새 알림 도착 시 배지 갱신 + 토스트 (새로고침 없이)
let __lastNotifTopId = null;
let __notifPollTimer = null;
async function pollNotifications() {
  if (!window.opClient || document.hidden) return;
  const uid = await currentUid();
  if (!uid) return;
  const [listRes, badgeRes] = await Promise.all([
    window.opClient.from('notifications').select('id,title,is_read,created_at').eq('partner_id', uid).order('created_at', { ascending: false }).limit(5),
    window.opClient.from('notifications').select('id', { count: 'exact', head: true }).eq('partner_id', uid).eq('is_read', false)
  ]);
  if (listRes.error) return;
  const list = listRes.data || [];
  if (!badgeRes.error) setNotificationBadge(badgeRes.count || 0);   // 정확한 미읽음 수(20개 제한과 무관)
  const top = list[0] || null;
  // 첫 폴링(초기값 설정)이 아니고, 최상단 알림이 새로 바뀌었고 미읽음이면 토스트
  if (__lastNotifTopId !== null && top && top.id !== __lastNotifTopId && !top.is_read) {
    showNotifToast(top.title || '새 알림이 도착했어요');
    const np = document.getElementById('page-notifications');
    if (np && np.classList.contains('active')) loadNotifications();
  }
  __lastNotifTopId = top ? top.id : null;
}
function startNotificationPolling() {
  if (__notifPollTimer) return;
  pollNotifications();
  __notifPollTimer = setInterval(pollNotifications, 45000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) pollNotifications(); });
}
function showNotifToast(text) {
  let el = document.getElementById('notif-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'notif-toast';
    el.className = 'notif-toast';
    document.body.appendChild(el);
    el.addEventListener('click', function () { showPage('notifications'); hideNotifToast(); });
  }
  el.innerHTML = '<span class="notif-toast-ico">🔔</span><span class="notif-toast-text">' + escHtml(text) + '</span>';
  el.classList.add('show');
  clearTimeout(el.__t);
  el.__t = setTimeout(hideNotifToast, 5000);
}
function hideNotifToast() {
  const el = document.getElementById('notif-toast');
  if (el) el.classList.remove('show');
}

function notificationMeta(type) {
  const map = {
    conversion_confirmed: { icon: '✅', color: '#8BE000' },
    conversion_canceled: { icon: '↩️', color: '#FFB020' },
    settlement_paid: { icon: '💸', color: '#8BE000' },
    account_suspended: { icon: '⛔', color: '#FF4D6A' },
    account_activated: { icon: '🟢', color: '#8BE000' },
    campaign: { icon: '🎁', color: '#8BE000' },
    ad: { icon: '📢', color: '#5BB8FF' },
    conversion_earn: { icon: '💰', color: '#FFB020' }
  };
  return map[type] || { icon: '🔔', color: 'var(--text2)' };
}

function relTime(v) {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  const s = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 60) return '방금';
  if (s < 3600) return Math.floor(s / 60) + '분 전';
  if (s < 86400) return Math.floor(s / 3600) + '시간 전';
  if (s < 604800) return Math.floor(s / 86400) + '일 전';
  return d.toISOString().slice(0, 10);
}

function renderNotifications(list) {
  const box = document.querySelector('#page-notifications .notif-list');
  if (!box) return;
  if (!list.length) {
    box.innerHTML = '<div class="notif-empty">' +
      '<div class="notif-empty-icon">🔔</div>' +
      '<div class="notif-title">아직 도착한 알림이 없어요</div>' +
      '<div class="notif-sub">새 알림이 생기면 이곳에 표시됩니다.</div>' +
      '</div>';
    return;
  }
  box.innerHTML = list.map(n => {
    const meta = notificationMeta(n.type);
    return '<div class="notif-item' + (n.is_read ? '' : ' unread') + '">' +
      '<div class="notif-icon" style="color:' + escHtml(meta.color) + ';">' + escHtml(meta.icon) + '</div>' +
      '<div class="notif-body">' +
        '<div class="notif-title">' + escHtml(n.title || '') + '</div>' +
        '<div class="notif-sub">' + escHtml(n.body || '') + '</div>' +
      '</div>' +
      '<div class="notif-time">' + escHtml(relTime(n.created_at)) + '</div>' +
      (n.is_read ? '' : '<div class="notif-dot-indicator"></div>') +
      '</div>';
  }).join('');
}

async function loadNotifications() {
  if (!window.opClient) return;
  const box = document.querySelector('#page-notifications .notif-list');
  if (box) box.innerHTML = '<div class="notif-empty"><div class="notif-empty-icon">🔔</div><div class="notif-title">알림을 불러오는 중...</div></div>';
  const uid = await currentUid();
  if (!uid) return;
  const { data, error } = await window.opClient
    .from('notifications')
    .select('id,type,title,body,is_read,created_at')
    .eq('partner_id', uid)
    .order('created_at', { ascending: false });
  if (error) {
    if (box) box.innerHTML = '<div class="notif-empty"><div class="notif-empty-icon">🔔</div><div class="notif-title">알림을 불러오지 못했어요</div><div class="notif-sub">' + escHtml(error.message) + '</div></div>';
    return;
  }
  const list = data || [];
  renderNotifications(list);
  const unreadIds = list.filter(n => !n.is_read).map(n => n.id);
  if (unreadIds.length) {
    if (window.__opAdminView) { setNotificationBadge(unreadIds.length); return; }
    setNotificationBadge(0);
    const { error: readErr } = await window.opClient.from('notifications').update({ is_read: true }).eq('partner_id', uid).in('id', unreadIds);
    if (readErr) {
      console.warn('notification read update failed:', readErr.message);
      setNotificationBadge(unreadIds.length);
    }
  } else {
    setNotificationBadge(0);
  }
}

// ── 초기화
document.addEventListener('DOMContentLoaded', async () => {
  if (window.__opDashboardReady) await window.__opDashboardReady;
  initNotificationToggles();
  loadAppSettings();   // 전역 설정(기본 수수료율·최소출금·정산안내) 먼저 로드
  loadPartnerHeader();
  startNotificationPolling();   // 배지 즉시 갱신 + 45초 폴링(준실시간)
  loadCampaignBanner();
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
  loadAds();
  const uid = await currentUid();
  if (!uid) return;
  const [linkRes, convRes] = await Promise.all([
    window.opClient.from('partner_links').select('id,product_name,title,product_url,clicks,conversions,created_at').eq('partner_id', uid).order('created_at', { ascending: false }),
    window.opClient.from('conversions').select('link_id,commission_amount,status,created_at').eq('partner_id', uid)
  ]);
  const links = linkRes.data || [];
  const convs = convRes.data || [];
  const validConvs = convs.filter(c => c.status !== 'canceled');
  const earningsByLink = {};
  const convCountByLink = {};
  validConvs.forEach(c => {
    if (!c.link_id) return;
    earningsByLink[c.link_id] = (earningsByLink[c.link_id] || 0) + Number(c.commission_amount || 0);
    convCountByLink[c.link_id] = (convCountByLink[c.link_id] || 0) + 1;
  });
  const totalClicks = links.reduce((s, l) => s + (l.clicks || 0), 0);
  const totalConv = validConvs.length;
  const revenue = validConvs.reduce((s, c) => s + Number(c.commission_amount || 0), 0);
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
        return '<tr><td><div class="td-link">' + escHtml(name) + '</div></td><td><div class="td-url">' + escHtml(shop) + '</div></td><td class="td-num">' + (l.clicks || 0) + '</td><td class="td-num">' + (convCountByLink[l.id] || 0) + '</td><td class="td-earn">' + formatWon(earningsByLink[l.id]) + '</td><td><span class="status-pill active"><span class="live-dot"></span>활성</span></td></tr>';
      }).join('');
    }
  }
  renderTopProducts(links, validConvs);
  applyOverviewChartData(convs);
}

function renderTopProducts(links, convs) {
  const wrap = document.getElementById('overview-top-products');
  if (!wrap) return;
  if (!convs.length) {
    wrap.innerHTML = '<div class="chart-empty"><div class="chart-empty-icon">🛒</div><div>아직 판매 데이터가 없어요</div></div>';
    return;
  }
  const linkMap = {};
  links.forEach(l => { linkMap[l.id] = l; });
  const grouped = {};
  convs.forEach(c => {
    if (!c.link_id) return;
    const link = linkMap[c.link_id];
    const title = (link && (link.product_name || link.title)) || '온종일팜 상품';
    if (!grouped[c.link_id]) grouped[c.link_id] = { title, count: 0, commission: 0 };
    grouped[c.link_id].count += 1;
    grouped[c.link_id].commission += Number(c.commission_amount || 0);
  });
  const rows = Object.keys(grouped).map(k => grouped[k])
    .sort((a, b) => b.count - a.count || b.commission - a.commission)
    .slice(0, 5);
  if (!rows.length) {
    wrap.innerHTML = '<div class="chart-empty"><div class="chart-empty-icon">🛒</div><div>아직 판매 데이터가 없어요</div></div>';
    return;
  }
  wrap.innerHTML = rows.map((item, i) => (
    '<div class="top-product-item">' +
      '<div class="top-product-rank">' + (i + 1) + '</div>' +
      '<div style="min-width:0;">' +
        '<div class="top-product-name" title="' + escHtml(item.title) + '">' + escHtml(item.title) + '</div>' +
        '<div class="top-product-meta">' + item.count.toLocaleString() + '건 판매</div>' +
      '</div>' +
      '<div class="top-product-earn">' + formatWon(item.commission) + '</div>' +
    '</div>'
  )).join('');
}

// ── 수익현황 실집계
async function loadEarnings() {
  if (!window.opClient) return;
  const uid = await currentUid();
  if (!uid) return;
  const { data } = await window.opClient.from('conversions').select('commission_amount,status,created_at').eq('partner_id', uid);
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
  buildMonthlyEarningsData(valid);
  const active = document.querySelector('#page-earnings .period-btn.active[data-earnings-range]')?.dataset.earningsRange || '6m';
  renderMonthlyEarningsChart(active);
  loadConvHistory();
}

// ── 전환 내역 + CSV 내보내기 (성과 리포트)
let __convHistory = [];
async function loadConvHistory() {
  const body = document.getElementById('conv-history-body');
  if (!window.opClient || !body) return;
  const uid = await currentUid();
  if (!uid) return;
  const [cRes, lRes] = await Promise.all([
    window.opClient.from('conversions').select('link_id,order_id,order_type,order_amount,commission_rate,commission_amount,status,created_at').eq('partner_id', uid).order('created_at', { ascending: false }),
    window.opClient.from('partner_links').select('id,product_name,title').eq('partner_id', uid)
  ]);
  const lm = {};
  (lRes.data || []).forEach(function (l) { lm[l.id] = l.product_name || l.title || ''; });
  __convHistory = (cRes.data || []).map(function (c) {
    return {
      date: c.created_at, product: lm[c.link_id] || '(상품)', orderId: c.order_id || '',
      orderAmount: Number(c.order_amount || 0), rate: Number(c.commission_rate || 0),
      commission: Number(c.commission_amount || 0), status: c.status || ''
    };
  });
  renderConvHistory();
}
function convStatusInfo(s) {
  return ({ pending: ['검수 대기', 'pending'], confirmed: ['확정', 'confirmed'], settled: ['정산 완료', 'settled'], canceled: ['취소', 'canceled'], cancelled: ['취소', 'canceled'] })[s] || [s || '-', 'pending'];
}
function fmtConvDate(iso) {
  const d = new Date(iso); if (isNaN(d)) return '';
  const p = function (n) { return String(n).padStart(2, '0'); };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
function renderConvHistory() {
  const body = document.getElementById('conv-history-body');
  if (!body) return;
  if (!__convHistory.length) {
    body.innerHTML = '<tr><td colspan="6" class="conv-empty">아직 전환 내역이 없어요.<br>내 링크로 첫 구매가 발생하면 여기에 표시돼요.</td></tr>';
    return;
  }
  body.innerHTML = __convHistory.slice(0, 100).map(function (c) {
    const si = convStatusInfo(c.status);
    return '<tr>' +
      '<td class="conv-date">' + escHtml(fmtConvDate(c.date)) + '</td>' +
      '<td>' + escHtml(c.product) + '</td>' +
      '<td class="conv-oid">' + escHtml(c.orderId) + '</td>' +
      '<td class="num">₩' + c.orderAmount.toLocaleString() + '</td>' +
      '<td class="num conv-comm">₩' + c.commission.toLocaleString() + '</td>' +
      '<td><span class="status-pill ' + si[1] + '">' + escHtml(si[0]) + '</span></td>' +
      '</tr>';
  }).join('');
}
function csvCell(v) {
  let s = v == null ? '' : String(v);
  if (/^[\s\x00-\x1f]*[=+\-@]/.test(s)) s = "'" + s;   // 선행 공백·제어문자 뒤 수식까지 방지
  if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function exportEarningsCSV() {
  if (!__convHistory.length) { alert('내보낼 전환 내역이 없어요.'); return; }
  const header = ['발생일', '상품', '주문번호', '상태', '주문금액', '수수료율(%)', '수수료'];
  const rows = __convHistory.map(function (c) {
    return [fmtConvDate(c.date), c.product, c.orderId, convStatusInfo(c.status)[0], c.orderAmount, Math.round(c.rate * 1000) / 10, c.commission];
  });
  const csv = [header].concat(rows).map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const d = new Date(); const p = function (n) { return String(n).padStart(2, '0'); };
  a.href = url; a.download = '온파트너_성과리포트_' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '.csv';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}
document.getElementById('earnings-csv-btn')?.addEventListener('click', exportEarningsCSV);

function buildMonthlyEarningsData(convs) {
  monthlyEarningsData = {
    '6m': buildMonthlySeries(convs, 6),
    '12m': buildMonthlySeries(convs, 12)
  };
}

function buildMonthlySeries(convs, months) {
  const now = new Date();
  const buckets = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({ key: monthKey(d), label: monthLabelFromKey(monthKey(d)), value: 0 });
  }
  const byMonth = {};
  buckets.forEach(b => { byMonth[b.key] = b; });
  convs.forEach(c => {
    if (!c.created_at) return;
    const key = monthKey(new Date(c.created_at));
    if (byMonth[key]) byMonth[key].value += Number(c.commission_amount || 0);
  });
  return buckets;
}

function renderMonthlyEarningsChart(range) {
  const wrap = document.getElementById('earnings-monthly-chart');
  if (!wrap) return;
  const data = monthlyEarningsData[range] || [];
  if (!data.length || !data.some(m => m.value > 0)) {
    wrap.innerHTML = '<div class="chart-empty"><div class="chart-empty-icon">📊</div><div>아직 월별 수익 데이터가 없어요</div></div>';
    return;
  }
  const max = Math.max(...data.map(m => m.value), 1);
  wrap.innerHTML =
    '<div class="monthly-bars">' +
      data.map((m, i) => {
        const h = Math.max(2, Math.round((m.value / max) * 100));
        const latest = i === data.length - 1 ? ' latest' : '';
        return '<div class="monthly-bar-item' + latest + '">' +
          '<div class="monthly-bar-value">' + (m.value ? formatWon(m.value) : '') + '</div>' +
          '<div class="monthly-bar-track"><div class="monthly-bar-fill" style="height:' + h + '%;"></div></div>' +
        '</div>';
      }).join('') +
    '</div>' +
    '<div class="monthly-labels">' +
      data.map((m, i) => '<div class="monthly-label' + (i === data.length - 1 ? ' latest' : '') + '">' + escHtml(m.label) + '</div>').join('') +
    '</div>';
}

// ── 정산 실집계
function maskAccount(a) { a = String(a || ''); return a.length > 4 ? '***-**-' + a.slice(-4) : a; }
async function loadSettlement() {
  if (!window.opClient) return;
  const uid = await currentUid();
  if (!uid) return;
  const [convRes, pRes, sRes] = await Promise.all([
    window.opClient.from('conversions').select('commission_amount,status').eq('partner_id', uid),
    window.opClient.from('partners').select('bank_name,bank_account,bank_holder,tax_type').eq('id', uid).maybeSingle(),
    window.opClient.from('settlements').select('period,total_amount,status,paid_at,gross_amount,withholding_amount,net_amount').eq('partner_id', uid).order('period', { ascending: false })
  ]);
  const convs = convRes.data || [];
  const confirmed = convs.filter(c => c.status === 'confirmed').reduce((s, c) => s + Number(c.commission_amount || 0), 0);
  const pendingReview = convs.filter(c => c.status === 'pending').reduce((s, c) => s + Number(c.commission_amount || 0), 0);
  const amtEl = document.getElementById('settle-amount');
  if (amtEl) amtEl.textContent = '₩' + Math.round(confirmed).toLocaleString();
  if (amtEl && amtEl.previousElementSibling) amtEl.previousElementSibling.textContent = '정산 예정액(확정)';
  // 원천징수(개인 3.3%) 안내
  const taxNote = document.getElementById('settle-tax-note');
  if (taxNote) {
    const isBiz = pRes.data && pRes.data.tax_type === 'business';
    if (isBiz) {
      taxNote.innerHTML = '정산 예정액(확정) 기준 · 사업자 전액 지급<br>검수 중 ' + formatWon(pendingReview);
    } else {
      const wh = Math.round(confirmed * 0.033);
      const net = Math.round(confirmed) - wh;
      taxNote.innerHTML = '정산 예정액(확정) 기준 · 원천징수 3.3%(-₩' + wh.toLocaleString() + ') 후 <b style="color:var(--lime);">실지급 ₩' + net.toLocaleString() + '</b><br>검수 중 ' + formatWon(pendingReview);
    }
  }
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const dEl = document.getElementById('settle-nextdate');
  if (dEl) dEl.textContent = next.getFullYear() + '년 ' + (next.getMonth() + 1) + '월 1일';
  // 관리자가 정한 정산 주기 안내 문구
  if (dEl && dEl.nextElementSibling && __appSettings.settlement_notice) dEl.nextElementSibling.textContent = __appSettings.settlement_notice;
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
        const gross = Number(s.gross_amount != null ? s.gross_amount : s.total_amount || 0);
        const withholding = Number(s.withholding_amount || 0);
        const net = Number(s.net_amount != null ? s.net_amount : s.total_amount || 0);
        return '<tr><td style="font-size:12px;">' + escHtml(s.period || '') + '</td>' +
          '<td class="td-num">-</td><td style="font-size:12px;color:var(--text2);">원천 ' + (withholding ? '3.3%' : '0%') + '</td><td style="font-size:12px;">' + formatWon(gross) + '<br><span style="color:var(--text3);">-' + formatWon(withholding) + '</span></td>' +
          '<td class="td-earn">' + formatWon(net) + '</td>' +
          '<td>' + (done ? '<span class="status-pill active">✓ 완료</span>' : '<span class="status-pill" style="background:rgba(245,158,11,0.1);color:#fbbf24;border-color:rgba(245,158,11,0.25);">⏳ 예정</span>') + '</td>' +
          '<td style="font-size:12px;color:var(--text3);">' + (s.paid_at ? String(s.paid_at).slice(0, 10).replace(/-/g, '.') : '-') + '</td></tr>';
      }).join('');
    }
  }
}

// ── 캐시·포인트
let __walletPartnerBank = null;
function walletAmountInput(id) {
  const raw = document.getElementById(id)?.value || '';
  const amount = Math.floor(Number(raw));
  return Number.isFinite(amount) ? amount : 0;
}
function walletDate(v) {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 10);
  return d.getFullYear() + '.' + pad2(d.getMonth() + 1) + '.' + pad2(d.getDate()) + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());
}
function walletKindLabel(kind, source) {
  const key = kind || source || '';
  const labels = {
    settlement: '정산적립',
    cash_add: '정산적립',
    add_cash: '정산적립',
    partner_settlement: '정산적립',
    convert_to_point: '전환',
    cash_to_point: '전환',
    withdraw_request: '출금신청',
    withdrawal_request: '출금신청',
    withdraw_complete: '출금완료',
    withdrawal_complete: '출금완료',
    point_use: '포인트사용',
    point_spend: '포인트사용'
  };
  return labels[key] || key || '-';
}
function walletStatusLabel(status) {
  const labels = {
    pending: '신청',
    requested: '신청',
    approved: '승인',
    paid: '출금완료',
    completed: '출금완료',
    rejected: '반려',
    canceled: '취소'
  };
  return labels[status] || status || '-';
}
function walletDelta(cashDelta, pointDelta) {
  const cash = Number(cashDelta || 0);
  const point = Number(pointDelta || 0);
  const parts = [];
  if (cash) parts.push((cash > 0 ? '+' : '-') + formatWon(Math.abs(cash)));
  if (point) parts.push((point > 0 ? '+' : '-') + Math.abs(Math.round(point)).toLocaleString() + 'P');
  return parts.length ? parts.join('<br>') : '-';
}
async function loadWallet() {
  if (!window.opClient) return;
  const uid = await currentUid();
  if (!uid) { window.location.href = 'login.html'; return; }
  const [accountRes, partnerRes, withdrawalsRes, ledgerRes] = await Promise.all([
    window.opClient.from('cash_accounts').select('cash_balance,point_balance').eq('user_id', uid).maybeSingle(),
    window.opClient.from('partners').select('bank_name,bank_account,bank_holder').eq('id', uid).maybeSingle(),
    window.opClient.from('cash_withdrawals').select('amount,status,bank_name,bank_account,bank_holder,created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(20),
    window.opClient.from('cash_ledger').select('kind,cash_delta,point_delta,cash_after,point_after,source,ref_type,ref_id,memo,created_at').eq('user_id', uid).order('created_at', { ascending: false }).limit(50)
  ]);
  if (accountRes.error && accountRes.error.code !== 'PGRST116') console.warn('[온파트너] 캐시 계좌 로드 오류:', accountRes.error.message);
  if (partnerRes.error && partnerRes.error.code !== 'PGRST116') console.warn('[온파트너] 계좌 로드 오류:', partnerRes.error.message);
  if (withdrawalsRes.error) console.warn('[온파트너] 출금 내역 로드 오류:', withdrawalsRes.error.message);
  if (ledgerRes.error) console.warn('[온파트너] 거래 내역 로드 오류:', ledgerRes.error.message);

  const account = accountRes.data || {};
  const cashEl = document.getElementById('wallet-cash-balance');
  const pointEl = document.getElementById('wallet-point-balance');
  if (cashEl) cashEl.textContent = formatWon(account.cash_balance || 0);
  if (pointEl) pointEl.textContent = Math.round(Number(account.point_balance || 0)).toLocaleString() + 'P';

  const p = partnerRes.data || {};
  __walletPartnerBank = p;
  const hasBank = !!(p.bank_name && p.bank_account && p.bank_holder);
  const bankEl = document.getElementById('wallet-bank-account');
  const holderEl = document.getElementById('wallet-bank-holder');
  const withdrawBtn = document.getElementById('wallet-withdraw-btn');
  const settingsBtn = document.getElementById('wallet-bank-settings-btn');
  if (bankEl) bankEl.textContent = hasBank ? (p.bank_name + ' ' + maskAccount(p.bank_account)) : '미등록';
  if (holderEl) holderEl.textContent = hasBank ? ('예금주: ' + p.bank_holder) : '설정에서 출금 계좌를 먼저 등록해주세요.';
  if (withdrawBtn) withdrawBtn.disabled = !hasBank;
  if (settingsBtn) settingsBtn.style.display = hasBank ? 'none' : 'flex';

  renderWalletWithdrawals(withdrawalsRes.data || []);
  renderWalletLedger(ledgerRes.data || []);
}
function renderWalletWithdrawals(list) {
  const tb = document.getElementById('wallet-withdrawals');
  if (!tb) return;
  if (!list.length) {
    tb.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:36px;color:var(--text3);">아직 출금 신청내역이 없어요.</td></tr>';
    return;
  }
  tb.innerHTML = list.map(w => {
    const account = [w.bank_name, maskAccount(w.bank_account || ''), w.bank_holder].filter(Boolean).join(' ');
    return '<tr>' +
      '<td style="font-size:12px;color:var(--text2);">' + escHtml(walletDate(w.created_at)) + '</td>' +
      '<td class="td-earn">' + formatWon(w.amount || 0) + '</td>' +
      '<td style="font-size:12px;">' + escHtml(account || '-') + '</td>' +
      '<td><span class="status-pill active">' + escHtml(walletStatusLabel(w.status)) + '</span></td>' +
      '</tr>';
  }).join('');
}
function renderWalletLedger(list) {
  const tb = document.getElementById('wallet-ledger');
  if (!tb) return;
  if (!list.length) {
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:36px;color:var(--text3);">아직 거래 내역이 없어요.</td></tr>';
    return;
  }
  tb.innerHTML = list.map(l => {
    const label = walletKindLabel(l.kind, l.source);
    const memo = l.memo || l.ref_type || l.source || '-';
    const balance = formatWon(l.cash_after || 0) + '<br><span style="color:var(--text3);">' + Math.round(Number(l.point_after || 0)).toLocaleString() + 'P</span>';
    return '<tr>' +
      '<td><b>' + escHtml(label) + '</b></td>' +
      '<td style="font-size:12px;color:var(--text2);">' + escHtml(memo) + '</td>' +
      '<td class="td-earn">' + walletDelta(l.cash_delta, l.point_delta) + '</td>' +
      '<td style="font-size:12px;">' + balance + '</td>' +
      '<td style="font-size:12px;color:var(--text3);">' + escHtml(walletDate(l.created_at)) + '</td>' +
      '</tr>';
  }).join('');
}
async function convertWalletCash(btn) {
  if (!window.opClient) return;
  if (window.__opAdminView) { alert('관리자 조회 모드에서는 캐시를 전환할 수 없어요.'); return; }
  const amount = walletAmountInput('wallet-convert-amount');
  if (amount <= 0) { alert('전환할 금액을 입력해주세요.'); return; }
  const t = btn.textContent; btn.disabled = true; btn.textContent = '전환 중...';
  const { error } = await window.opClient.rpc('cp_convert_to_point', { p_amount: amount });
  btn.disabled = false; btn.textContent = t;
  if (error) { alert('전환 실패: ' + error.message); return; }
  const input = document.getElementById('wallet-convert-amount');
  if (input) input.value = '';
  loadWallet();
  if (confirm('쇼핑포인트로 전환됐어요! 🎉\n온종일팜에서 바로 사용하러 갈까요?')) {
    window.open('https://app.yuanfnb.com/shop/mypage', '_blank', 'noopener');
  }
}
async function requestWalletWithdraw(btn) {
  if (!window.opClient) return;
  if (window.__opAdminView) { alert('관리자 조회 모드에서는 출금을 신청할 수 없어요.'); return; }
  const amount = walletAmountInput('wallet-withdraw-amount');
  if (amount <= 0) { alert('출금할 금액을 입력해주세요.'); return; }
  const minW = Number(__appSettings.min_withdrawal) || 0;
  if (amount < minW) { alert('최소 출금액은 ' + minW.toLocaleString() + '원이에요.\n' + minW.toLocaleString() + '원 이상부터 출금할 수 있어요.'); return; }
  const p = __walletPartnerBank || {};
  if (!(p.bank_name && p.bank_account && p.bank_holder)) { alert('설정에서 출금 계좌를 먼저 등록해주세요.'); showPage('settings'); return; }
  const ok = confirm(formatWon(amount) + ' 출금을 신청할까요?\n' + p.bank_name + ' ' + maskAccount(p.bank_account) + ' / ' + p.bank_holder);
  if (!ok) return;
  const t = btn.textContent; btn.disabled = true; btn.textContent = '신청 중...';
  const { error } = await window.opClient.rpc('cp_request_withdraw', {
    p_amount: amount,
    p_bank_name: p.bank_name,
    p_bank_account: p.bank_account,
    p_bank_holder: p.bank_holder
  });
  btn.disabled = false; btn.textContent = t;
  if (error) { alert('출금 신청 실패: ' + error.message); return; }
  const input = document.getElementById('wallet-withdraw-amount');
  if (input) input.value = '';
  alert('출금 신청이 접수됐어요.');
  loadWallet();
}

// ── 설정 (프로필·정산계좌)
async function loadSettings() {
  initNotificationToggles();
  if (!window.opClient) return;
  const { data: { user } } = await window.opClient.auth.getUser();
  if (!user) return;
  let { data: p, error } = await window.opClient.from('partners').select('*').eq('id', user.id).maybeSingle();
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

  // 세금 정보
  const taxType = p.tax_type || 'individual';
  const taxRadio = document.querySelector('input[name="tax-type"][value="' + taxType + '"]');
  if (taxRadio) taxRadio.checked = true;
  setVal('set-resident-no', p.resident_no);
  setVal('set-business-no', p.business_no);
  setVal('set-business-name', p.business_name);
  onTaxTypeChange();
}
// ── 세금 정보: 개인/사업자 필드 전환
function onTaxTypeChange() {
  const type = document.querySelector('input[name="tax-type"]:checked')?.value || 'individual';
  const ind = document.getElementById('tax-individual-fields');
  const biz = document.getElementById('tax-business-fields');
  if (ind) ind.style.display = type === 'individual' ? '' : 'none';
  if (biz) biz.style.display = type === 'business' ? 'flex' : 'none';
}
async function saveTax(btn) {
  if (!window.opClient) return;
  const type = document.querySelector('input[name="tax-type"]:checked')?.value || 'individual';
  const payload = { tax_type: type };
  if (type === 'individual') {
    const rn = (document.getElementById('set-resident-no')?.value || '').trim();
    if (!rn) { alert('주민등록번호를 입력해주세요.'); return; }
    payload.resident_no = rn;
    payload.business_no = null;
    payload.business_name = null;
  } else {
    const bn = (document.getElementById('set-business-no')?.value || '').trim();
    const bname = (document.getElementById('set-business-name')?.value || '').trim();
    if (!bn || !bname) { alert('사업자등록번호와 상호를 입력해주세요.'); return; }
    payload.business_no = bn;
    payload.business_name = bname;
    payload.resident_no = null;
  }
  const { data: { user } } = await window.opClient.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return; }
  const t = btn.textContent; btn.disabled = true; btn.textContent = '저장 중...';
  const { error } = await window.opClient.from('partners').update(payload).eq('id', user.id);
  btn.disabled = false; btn.textContent = t;
  if (error) { alert('저장 실패: ' + error.message); return; }
  alert('세금 정보가 저장됐어요!');
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

// ── 탈퇴: 계정(auth.users) 완전 삭제 → 같은 이메일로 재가입 자유
async function withdrawPartner(btn) {
  if (!window.opClient) return;
  const ok = confirm('정말 탈퇴하시겠어요?\n\n탈퇴하면 온파트너 계정과 발급한 링크·수익 내역이 모두 삭제되며, 이 작업은 되돌릴 수 없습니다.\n(같은 이메일로 언제든 다시 가입할 수 있어요.)');
  if (!ok) return;

  const { data: { session } } = await window.opClient.auth.getSession();
  if (!session) { window.location.href = 'login.html'; return; }

  const t = btn?.textContent || '탈퇴하기';
  if (btn) { btn.disabled = true; btn.textContent = '탈퇴 처리 중...'; }
  try {
    const resp = await fetch('/api/withdraw', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + session.access_token }
    });
    const out = await resp.json().catch(() => ({}));
    if (!resp.ok || !out.ok) {
      if (btn) { btn.disabled = false; btn.textContent = t; }
      alert('탈퇴 처리에 실패했어요: ' + (out.err || resp.status));
      return;
    }
  } catch (e) {
    if (btn) { btn.disabled = false; btn.textContent = t; }
    alert('탈퇴 처리 중 오류가 났어요: ' + e);
    return;
  }

  await window.opClient.auth.signOut().catch(() => {});
  alert('탈퇴가 완료됐어요. 그동안 이용해주셔서 감사합니다.');
  window.location.href = '../index.html';
}

// ── 알림 토글 스위치
const NOTIF_STORAGE_PREFIX = 'ptnr-notif-';

function initNotificationToggles() {
  document.querySelectorAll('.toggle-wrap[data-key]').forEach(wrap => {
    const track = wrap.querySelector('.toggle-track');
    if (!track) return;
    const saved = localStorage.getItem(NOTIF_STORAGE_PREFIX + wrap.dataset.key);
    const on = saved == null ? track.classList.contains('on') : saved === 'true';
    track.classList.toggle('on', on);
    wrap.dataset.on = on ? 'true' : 'false';
    wrap.setAttribute('role', 'switch');
    wrap.setAttribute('aria-checked', on ? 'true' : 'false');
    wrap.setAttribute('tabindex', '0');
  });
}

function setNotificationToggle(wrap, on) {
  const track = wrap.querySelector('.toggle-track');
  if (!track || !wrap.dataset.key) return;
  track.classList.toggle('on', on);
  wrap.dataset.on = on ? 'true' : 'false';
  wrap.setAttribute('aria-checked', on ? 'true' : 'false');
  localStorage.setItem(NOTIF_STORAGE_PREFIX + wrap.dataset.key, on ? 'true' : 'false');
}

document.addEventListener('click', (e) => {
  const wrap = e.target.closest('.toggle-wrap[data-key]');
  if (!wrap) return;
  setNotificationToggle(wrap, wrap.dataset.on !== 'true');
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const wrap = e.target.closest?.('.toggle-wrap[data-key]');
  if (!wrap) return;
  e.preventDefault();
  setNotificationToggle(wrap, wrap.dataset.on !== 'true');
});
