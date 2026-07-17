// 온파트너 링크 라우터: /r/{code}
// 방문자 클릭 → 클릭 기록(service role) + 온종일팜 상품페이지로 리다이렉트(op_ref 쿠키/파라미터)
module.exports = async (req, res) => {
  const SUPA = process.env.SUPABASE_URL;
  const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const FALLBACK = 'https://app.yuanfnb.com/shop';
  const code = (req.query && req.query.code ? String(req.query.code) : '').trim();

  const go = (url) => { res.statusCode = 302; res.setHeader('Location', url); res.end(); };
  const isSafeCode = (s) => /^[a-z0-9-]{4,64}$/i.test(s);
  const safeDest = (url) => {
    try {
      const u = new URL(url);
      if (u.protocol !== 'https:' || u.hostname !== 'app.yuanfnb.com') return FALLBACK;
      return u.toString();
    } catch (e) {
      return FALLBACK;
    }
  };

  if (!SUPA || !SRK || !code || !isSafeCode(code)) return go(FALLBACK);

  try {
    const headers = { apikey: SRK, Authorization: 'Bearer ' + SRK, 'Content-Type': 'application/json' };
    // 링크 + 전역 설정(쿠키 유효기간) 병렬 조회
    const [q, cs] = await Promise.all([
      fetch(SUPA + '/rest/v1/partner_links?select=id,product_url,partner_id,partners(status)&code=eq.' + encodeURIComponent(code), { headers }),
      fetch(SUPA + '/rest/v1/op_settings?select=value&key=eq.cookie_days', { headers }).catch(() => null)
    ]);
    let cookieDays = 30;
    try { const csr = cs && await cs.json(); if (Array.isArray(csr) && csr[0]) { const n = parseInt(csr[0].value, 10); if (n >= 1 && n <= 90) cookieDays = n; } } catch (e) {}
    const rows = await q.json();
    if (!Array.isArray(rows) || !rows.length) return go(FALLBACK);
    const link = rows[0];
    if (link.partners && link.partners.status === 'suspended') return go(FALLBACK);

    // 클릭 기록 + 카운트 증가 (실패해도 리다이렉트는 진행)
    fetch(SUPA + '/rest/v1/link_clicks', {
      method: 'POST', headers,
      body: JSON.stringify({
        link_id: link.id,
        referer: req.headers['referer'] || req.headers['referrer'] || null,
        user_agent: req.headers['user-agent'] || null
      })
    }).catch(() => {});
    fetch(SUPA + '/rest/v1/rpc/op_increment_click', {
      method: 'POST', headers, body: JSON.stringify({ p_link: link.id })
    }).catch(() => {});

    // 전환 추적 쿠키(관리자 설정 유효기간) + 온종일팜 상품으로 이동
    const base = safeDest(link.product_url);
    const dest = base + (base.includes('?') ? '&' : '?') + 'op_ref=' + encodeURIComponent(code);
    res.setHeader('Set-Cookie', 'op_ref=' + encodeURIComponent(code) + '; Max-Age=' + (cookieDays * 86400) + '; Path=/; SameSite=Lax; Secure');
    return go(dest);
  } catch (e) {
    return go(FALLBACK);
  }
};
