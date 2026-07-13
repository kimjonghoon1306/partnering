// ══════════ 온파트너 인트로 (세션당 1회) ══════════
(function () {
  const intro = document.getElementById('intro');
  if (!intro) return;

  const SEEN_KEY = 'onpartner_intro_seen';

  // 이미 이번 세션에 봤으면 즉시 제거
  if (sessionStorage.getItem(SEEN_KEY)) {
    intro.classList.add('gone');
    return;
  }

  // 인트로 도는 동안 배경 스크롤 잠금
  document.body.style.overflow = 'hidden';

  const scenes = Array.from(intro.querySelectorAll('.intro-scene'));
  const skipBtn = document.getElementById('intro-skip');
  const earnEl = document.getElementById('intro-earn');

  const SCENE_MS = 1800;          // 씬당 노출 시간
  let idx = -1;
  let timers = [];
  let done = false;

  function showScene(n) {
    scenes.forEach((s, i) => s.classList.toggle('active', i === n));
    if (n === 1) runEarnCounter();
  }

  // SCENE 2 숫자 카운트업
  function runEarnCounter() {
    if (!earnEl) return;
    const target = 38500;
    let v = 0;
    const t = setInterval(() => {
      v = Math.min(v + 1900, target);
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
    timers.forEach(clearTimeout);
    timers.forEach(clearInterval);
    sessionStorage.setItem(SEEN_KEY, '1');
    document.body.style.overflow = '';
    intro.classList.add('hide');
    setTimeout(() => intro.classList.add('gone'), 750);
  }

  skipBtn?.addEventListener('click', finish);
  // 시작
  requestAnimationFrame(next);
})();
