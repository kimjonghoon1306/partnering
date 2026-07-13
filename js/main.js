// ── 테마 토글
function initTheme() {
  const saved = localStorage.getItem('ptnr-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn(saved);
}

function updateThemeBtn(theme) {
  const icon = theme === 'dark' ? '☀️' : '🌙';
  ['theme-btn', 'theme-btn-mobile'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.textContent = icon;
  });
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ptnr-theme', next);
  updateThemeBtn(next);
}

document.getElementById('theme-btn')?.addEventListener('click', toggleTheme);
document.getElementById('theme-btn-mobile')?.addEventListener('click', toggleTheme);
initTheme();

// ── 햄버거 메뉴
const hamburger = document.getElementById('nav-hamburger');
const mobileMenu = document.getElementById('mobile-menu');

function closeMobileMenu() {
  hamburger?.classList.remove('open');
  mobileMenu?.classList.remove('open');
}

hamburger?.addEventListener('click', () => {
  const isOpen = hamburger.classList.toggle('open');
  mobileMenu?.classList.toggle('open', isOpen);
});

// 메뉴 외부 클릭 시 닫기
document.addEventListener('click', e => {
  if (!hamburger?.contains(e.target) && !mobileMenu?.contains(e.target)) {
    closeMobileMenu();
  }
});

// ── 스크롤 리빌 애니메이션
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── 카테고리 탭 활성화
document.querySelectorAll('.cat-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  });
});

// ── 부드러운 앵커 스크롤
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ── 숫자 카운트업 애니메이션
function countUp(el, target, duration = 1500, prefix = '', suffix = '') {
  const start = performance.now();
  const update = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = prefix + Math.floor(ease * target).toLocaleString() + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const nums = entry.target.querySelectorAll('.stat-num[data-count]');
      nums.forEach(el => {
        const count = parseInt(el.dataset.count);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        countUp(el, count, 1500, prefix, suffix);
      });
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const statsBar = document.querySelector('.stats-bar');
if (statsBar) statsObserver.observe(statsBar);

// ── 프로모션 애니메이션
(function() {
  const STEPS = 4;
  const DURATION = 4000; // 스텝당 4초
  let current = 0;
  let timer = null;
  let progress = 0;
  let progTimer = null;

  const tabs    = document.querySelectorAll('.promo-tab');
  const steps   = document.querySelectorAll('.promo-step');
  const dots    = document.querySelectorAll('.promo-dot');
  const bar     = document.getElementById('promo-progress');

  function goStep(n) {
    current = n;
    // 탭/스텝/점 업데이트
    tabs.forEach((t, i) => t.classList.toggle('active', i === n));
    steps.forEach((s, i) => s.classList.toggle('active', i === n));
    dots.forEach((d, i) => d.classList.toggle('active', i === n));
    // 스텝별 애니메이션
    if (n === 0) animateStep0();
    if (n === 1) animateStep1();
    if (n === 2) animateStep2();
    if (n === 3) animateStep3();
    // 진행 바 리셋
    clearInterval(progTimer);
    progress = 0;
    if (bar) bar.style.width = '0%';
    progTimer = setInterval(() => {
      progress += 100 / (DURATION / 100);
      if (bar) bar.style.width = Math.min(progress, 100) + '%';
    }, 100);
  }

  function nextStep() {
    goStep((current + 1) % STEPS);
  }

  function startAuto() {
    clearInterval(timer);
    timer = setInterval(nextStep, DURATION);
  }

  // 탭/점 클릭 시 수동 전환
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => { goStep(i); clearInterval(timer); startAuto(); });
  });
  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => { goStep(i); clearInterval(timer); startAuto(); });
  });

  // 스텝0: 타이핑 효과
  function animateStep0() {
    const el = document.getElementById('url-text');
    const result = document.getElementById('promo-result');
    if (!el) return;
    const text = 'app.yuanfnb.com/product/123';
    el.textContent = '';
    if (result) result.classList.remove('show');
    let i = 0;
    const t = setInterval(() => {
      el.textContent = text.slice(0, ++i);
      if (i >= text.length) {
        clearInterval(t);
        setTimeout(() => result?.classList.add('show'), 300);
      }
    }, 55);
  }

  // 스텝1: 공유 아이템 애니메이션 (CSS로 처리)
  function animateStep1() {
    const items = document.querySelectorAll('#pstep-1 .promo-share-item');
    items.forEach(item => {
      item.style.opacity = '0';
      item.style.transform = 'scale(0.8)';
    });
    setTimeout(() => {
      items.forEach(item => {
        item.style.opacity = '';
        item.style.transform = '';
      });
    }, 50);
  }

  // 스텝2: 플로우 아이템 순서대로 활성화
  function animateStep2() {
    const flows = document.querySelectorAll('#pstep-2 .promo-flow-item');
    flows.forEach(f => { f.classList.remove('done', 'active'); });
    let i = 0;
    const t = setInterval(() => {
      if (i < flows.length) {
        if (i > 0) flows[i-1].classList.remove('active');
        flows[i].classList.add(i < flows.length - 1 ? 'done' : 'active');
        i++;
      } else clearInterval(t);
    }, 600);
  }

  // 스텝3: 수익 카운트업
  function animateStep3() {
    const earnEl = document.getElementById('earn-counter');
    const totalEl = document.getElementById('total-counter');
    const fillEl = document.getElementById('total-fill');
    const earnTarget = 10000;
    const totalTarget = 384200;

    if (earnEl) {
      let v = 0;
      const t = setInterval(() => {
        v = Math.min(v + 500, earnTarget);
        earnEl.textContent = '+₩' + v.toLocaleString();
        if (v >= earnTarget) clearInterval(t);
      }, 40);
    }
    if (totalEl) {
      let v = 0;
      const t = setInterval(() => {
        v = Math.min(v + 8000, totalTarget);
        totalEl.textContent = '₩' + v.toLocaleString();
        if (v >= totalTarget) clearInterval(t);
      }, 30);
    }
    if (fillEl) setTimeout(() => { fillEl.style.width = '72%'; }, 200);
  }

  // 섹션이 화면에 들어올 때 시작
  const section = document.querySelector('.promo-section');
  if (section) {
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        goStep(0);
        startAuto();
        obs.unobserve(section);
      }
    }, { threshold: 0.3 });
    obs.observe(section);
  }
})();
