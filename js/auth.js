// ── 테마 토글
function initTheme() {
  const saved = localStorage.getItem('ptnr-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn(saved);
}
function updateThemeBtn(theme) {
  const btn = document.getElementById('theme-btn');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ptnr-theme', next);
  updateThemeBtn(next);
}
document.getElementById('theme-btn')?.addEventListener('click', toggleTheme);
initTheme();

// ── 비밀번호 토글
document.querySelectorAll('.input-eye').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = btn.closest('.form-input-wrap').querySelector('input');
    if (!input) return;
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.textContent = isHidden ? '🙈' : '👁';
  });
});

// ── 비밀번호 강도 체크
function checkPwStrength(val) {
  const el = document.getElementById('pw-strength');
  const label = document.getElementById('pw-label');
  if (!el || !label) return;

  if (!val) { el.style.display = 'none'; return; }
  el.style.display = 'block';

  let score = 0;
  if (val.length >= 8) score++;
  if (val.length >= 12) score++;
  if (/[A-Z]/.test(val) || /[0-9]/.test(val)) score++;
  if (/[!@#$%^&*]/.test(val)) score++;

  const bars = ['pb1','pb2','pb3','pb4'].map(id => document.getElementById(id));
  bars.forEach(b => { if (b) b.className = 'pw-bar'; });

  const cls = score <= 1 ? 'weak' : score <= 2 ? 'medium' : 'strong';
  const labelMap = { weak: '약함', medium: '보통', strong: '강함' };
  const count = score <= 1 ? 1 : score <= 2 ? 2 : 4;

  for (let i = 0; i < count; i++) {
    if (bars[i]) bars[i].classList.add(cls);
  }
  label.textContent = labelMap[cls];
  label.className = 'pw-label ' + cls;
}

// ── 회원가입 단계 이동
let currentStep = 1;

async function nextStep(e, step) {
  e?.preventDefault();
  if (step === 2) {
    const pw = document.getElementById('password')?.value;
    const pwc = document.getElementById('password-confirm')?.value;
    if (pw !== pwc) {
      const err = document.getElementById('pw-match-error');
      if (err) err.classList.add('show');
      return;
    }
    document.getElementById('pw-match-error')?.classList.remove('show');
    goStep(2);
    return;
  }
  if (step === 3) { await handleSignup(e); return; }  // 마지막 단계 = 실제 가입
  goStep(step);
}

function goStep(step) {
  for (let i = 1; i <= 3; i++) {
    const page = document.getElementById('page-' + i);
    if (page) page.style.display = i === step ? 'block' : 'none';
  }
  updateStepUI(step);
  currentStep = step;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepUI(current) {
  for (let i = 1; i <= 3; i++) {
    const circle = document.getElementById('step-' + i);
    const label = circle?.nextElementSibling;
    const line = document.getElementById('line-' + i);
    if (!circle) continue;

    circle.className = 'step-circle' + (i < current ? ' done' : i === current ? ' active' : '');
    circle.textContent = i < current ? '✓' : i;
    if (label) label.className = 'step-label' + (i < current ? ' done' : i === current ? ' active' : '');
    if (line) line.className = 'step-line' + (i < current ? ' done' : '');
  }
}

// ── 쇼핑몰 입점 단계 이동
function shopNextStep(e, step) {
  e?.preventDefault();
  shopGoStep(step);
}

function shopGoStep(step) {
  const pages = ['sp1','sp2','sp3','sp-done'];
  pages.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.style.display = (i + 1 === step || (step > 3 && i === 3)) ? 'block' : 'none';
  });

  // 단계 UI 업데이트
  for (let i = 1; i <= 3; i++) {
    const circle = document.getElementById('s' + i);
    const label = document.getElementById('sl' + i);
    const line = document.getElementById('ln' + i);
    if (!circle) continue;
    circle.className = 'step-circle' + (i < step ? ' done' : i === step ? ' active' : '');
    circle.textContent = i < step ? '✓' : i;
    if (label) label.className = 'step-label' + (i < step ? ' done' : i === step ? ' active' : '');
    if (line) line.className = 'step-line' + (i < step ? ' done' : '');
  }

  // 수수료 카드 생성 (2단계)
  if (step === 2) buildCatRates();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function shopSubmit(e) {
  e?.preventDefault();
  shopGoStep(4);
}

// ── 카테고리별 수수료 설정 UI 생성
const CATS = [
  { id: 'food', label: '🐟 수산·식품', default: 7 },
  { id: 'beauty', label: '💄 뷰티·화장품', default: 10 },
  { id: 'fashion', label: '👗 패션·의류', default: 9 },
  { id: 'home', label: '🏠 가구·인테리어', default: 8 },
  { id: 'health', label: '🧘 건강·운동', default: 12 },
  { id: 'pet', label: '🐾 반려동물', default: 10 },
  { id: 'tech', label: '🖥️ 전자·디지털', default: 5 },
];

function buildCatRates() {
  const container = document.getElementById('cat-rates');
  if (!container || container.children.length > 0) return;

  CATS.forEach(cat => {
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;gap:12px;background:var(--dark4);border:1px solid var(--border);border-radius:var(--radius);padding:12px 16px;';
    div.innerHTML = `
      <span style="font-size:14px;font-weight:600;min-width:130px;">${cat.label}</span>
      <input type="range" min="1" max="20" value="${cat.default}"
        oninput="document.getElementById('cr-${cat.id}').textContent=this.value+'%'"
        style="flex:1;">
      <span id="cr-${cat.id}" style="font-size:15px;font-weight:900;color:var(--lime);min-width:40px;text-align:right;">${cat.default}%</span>
    `;
    container.appendChild(div);
  });
}

// ── 기본 수수료 슬라이더
function updateRate(id) {
  const input = document.getElementById(id + '-rate');
  const display = document.getElementById(id + '-rate-display');
  if (input && display) display.textContent = input.value + '%';
}

// ── 태그 선택
document.querySelectorAll('.tag-select').forEach(group => {
  group.addEventListener('click', e => {
    const tag = e.target.closest('.tag-item');
    if (!tag) return;
    tag.classList.toggle('selected');
  });
});

// ── 회원가입 처리 (Supabase)
async function handleSignup(e) {
  const form = document.getElementById('form-2');
  const btn = form?.querySelector('button[type="submit"]');
  const setBtn = (t, dis) => { if (btn) { btn.disabled = dis; btn.textContent = t; } };
  const showErr = (msg) => alert(msg);

  const name = document.getElementById('name')?.value.trim();
  const nickname = document.getElementById('nickname')?.value.trim();
  const phone = document.getElementById('phone')?.value.trim() || null;
  const email = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value;
  const channels = opSelectedTags('channel-tags');
  const categories = opSelectedTags('category-tags');
  const follower_scale = document.getElementById('followers')?.value || null;

  if (!email || !password) { showErr('이메일과 비밀번호를 입력해주세요.'); return; }
  if (!window.opClient) { showErr('연결 오류입니다. 새로고침 후 다시 시도해주세요.'); return; }

  setBtn('가입 중...', true);
  const info = { name, nickname, phone, email, channels, categories, follower_scale };
  const { data, error } = await window.opClient.auth.signUp({
    email, password,
    options: { data: { name, nickname, phone, channels, categories, follower_scale, role: 'partner' } }
  });

  if (error) {
    setBtn('다음 단계 →', false);
    const m = /already registered/i.test(error.message)
      ? '이미 가입된 이메일이에요. 로그인해주세요.'
      : (/at least 6/i.test(error.message) ? '비밀번호는 6자 이상이어야 해요.' : '가입에 실패했어요: ' + error.message);
    showErr(m);
    return;
  }

  // 세션이 바로 있으면(이메일 확인 OFF) partners 즉시 생성
  if (data.session && data.user) {
    await opEnsurePartner(data.user, info);
  }
  // 세션 없으면(이메일 확인 ON) → 첫 로그인 때 opEnsurePartner가 생성

  goStep(3);
  // 이메일 확인이 필요한 경우 완료화면에 안내
  if (!data.session) {
    const sub = document.querySelector('#page-3 .auth-sub');
    if (sub) sub.innerHTML = '가입 신청 완료! 📩<br><b>' + (email || '') +
      '</b> 으로 보낸 <b>확인 메일</b>의 링크를 눌러야<br>로그인할 수 있어요.';
    const goBtn = document.querySelector('#page-3 a.auth-submit');
    if (goBtn) { goBtn.setAttribute('href', 'login.html'); goBtn.textContent = '로그인하러 가기 →'; }
  }
}

// ── 로그인 처리 (Supabase)
async function handleLogin(e) {
  e?.preventDefault();
  const btn = document.getElementById('submit-btn');
  const setBtn = (t, dis) => { if (btn) { btn.disabled = dis; btn.textContent = t; } };
  const errBox = document.getElementById('login-error');
  const showErr = (msg) => {
    if (errBox) { errBox.textContent = msg; errBox.style.display = 'block'; } else alert(msg);
  };
  if (errBox) errBox.style.display = 'none';

  const email = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value;
  if (!email || !password) { showErr('이메일과 비밀번호를 입력해주세요.'); return; }
  if (!window.opClient) { showErr('연결 오류입니다. 새로고침 후 다시 시도해주세요.'); return; }

  setBtn('로그인 중...', true);
  const { data, error } = await window.opClient.auth.signInWithPassword({ email, password });
  if (error) {
    setBtn('로그인', false);
    const m = /Email not confirmed/i.test(error.message)
      ? '이메일 확인이 필요해요. 받은 메일의 링크를 눌러주세요.'
      : (/Invalid login/i.test(error.message) ? '이메일 또는 비밀번호가 올바르지 않아요.' : '로그인 실패: ' + error.message);
    showErr(m);
    return;
  }
  await opEnsurePartner(data.user);  // partners 없으면 metadata로 생성
  window.location.href = 'dashboard.html';
}
