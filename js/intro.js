// ══════════ 온파트너 인트로 (세션당 1회 자동 + 언제든 다시보기) ══════════
(function () {
  const intro = document.getElementById('intro');
  if (!intro) return;

  const SEEN_KEY = 'onpartner_intro_seen';
  const SCENE_MS = 2300;          // 씬당 노출 시간 (넉넉하게)

  const scenes = Array.from(intro.querySelectorAll('.intro-scene'));
  const skipBtn = document.getElementById('intro-skip');
  const earnEl = document.getElementById('intro-earn');

  let timers = [];
  let idx = -1;
  let done = false;

  function clearTimers() {
    timers.forEach(t => { clearTimeout(t); clearInterval(t); });
    timers = [];
  }

  function showScene(n) {
    scenes.forEach((s, i) => s.classList.toggle('active', i === n));
    if (n === 1) runEarnCounter();
  }

  // SCENE 2 숫자 카운트업
  function runEarnCounter() {
    if (!earnEl) return;
    const target = 38500;
    let v = 0;
    earnEl.textContent = '+₩0';
    const t = setInterval(() => {
      v = Math.min(v + 1500, target);
      earnEl.textContent = '+₩' + v.toLocaleString();
      if (v >= target) clearInterval(t);
    }, 45);
    timers.push(t);
  }

  function next() {
    idx++;
    if (idx >= scenes.length) { finish(); return; }
    showScene(idx);
    timers.push(setTimeout(next, SCENE_MS));
  }

  function finish() {
    if (done) return;
    done = true;
    clearTimers();
    sessionStorage.setItem(SEEN_KEY, '1');
    document.body.style.overflow = '';
    intro.classList.add('hide');
    timers.push(setTimeout(() => intro.classList.add('gone'), 750));
  }

  // 재생(자동 최초 + 다시보기 공용)
  function play() {
    clearTimers();
    done = false;
    idx = -1;
    scenes.forEach(s => s.classList.remove('active'));
    intro.classList.remove('gone', 'hide');
    document.body.style.overflow = 'hidden';
    // 리플로우 강제 후 시작 (다시보기 시 트랜지션 재적용)
    void intro.offsetWidth;
    requestAnimationFrame(next);
  }

  skipBtn?.addEventListener('click', finish);

  // 전역 노출 → 다시보기 버튼에서 호출
  window.OnPartnerIntro = { play };

  // 최초 세션이면 자동 재생, 아니면 숨김
  if (sessionStorage.getItem(SEEN_KEY)) {
    intro.classList.add('gone');
  } else {
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(next);
  }
})();
