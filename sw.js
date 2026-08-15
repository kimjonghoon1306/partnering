// 온파트너 서비스워커 — PWA 설치 + 업데이트 배너용
// 배포마다 VERSION을 올리면 새 SW가 설치되고, 클라이언트에 업데이트 배너가 뜬다.
const VERSION = 'onpartner-20260816-3';

self.addEventListener('install', (e) => {
  // 새 SW를 곧바로 대기 상태로 (waiting) — 페이지가 "업데이트하세요"를 띄운다
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// 페이지가 "지금 업데이트"를 누르면 대기 SW를 즉시 활성화
self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});

// 설치형 PWA 요건: fetch 핸들러 존재. 네트워크 우선(항상 최신), 실패 시 캐시.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req))
  );
});
