/* 온파트너 추적 스크립트 (온종일팜 등 쇼핑몰에 삽입)
 * 1) 페이지 진입 시 URL의 op_ref 파라미터 → localStorage(30일 유지)
 * 2) 구매완료 페이지에서 Partnering.track({ orderId, amount, orderType }) 호출 → 수수료 적립
 * 삽입: <script src="https://partnering.vercel.app/tracker.js"></script>
 */
(function () {
  var ENDPOINT = 'https://partnering.vercel.app/api/track';
  var KEY = 'op_ref', KEY_T = 'op_ref_t', TTL = 2592000000; // 30일(ms)

  // 1) 유입 캡처
  try {
    var ref = new URLSearchParams(location.search).get('op_ref');
    if (ref) { localStorage.setItem(KEY, ref); localStorage.setItem(KEY_T, String(Date.now())); }
  } catch (e) {}

  function getRef() {
    try {
      var t = Number(localStorage.getItem(KEY_T) || 0);
      if (!t || Date.now() - t > TTL) { localStorage.removeItem(KEY); localStorage.removeItem(KEY_T); return ''; }
      return localStorage.getItem(KEY) || '';
    } catch (e) { return ''; }
  }

  // 2) 전환 전송
  window.Partnering = {
    getRef: getRef,
    track: function (o) {
      o = o || {};
      var code = getRef();
      if (!code) return; // 파트너 링크로 안 들어온 방문자
      var payload = {
        code: code,
        order_id: o.orderId || o.order_id,
        order_type: o.orderType || o.order_type || 'general',
        amount: o.amount || o.order_amount
      };
      if (!payload.order_id || !payload.amount) return;
      try {
        fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(function () {});
      } catch (e) {}
      // 적립 후 재적립 방지(구매 1건=1회)
      try { localStorage.removeItem(KEY); localStorage.removeItem(KEY_T); } catch (e) {}
    }
  };
})();
