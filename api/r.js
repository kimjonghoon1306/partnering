// 온파트너 링크 라우터: /r/{code}
// 방문자 클릭 → 클릭 기록(service role) + 온종일팜 상품페이지로 리다이렉트(op_ref 쿠키/파라미터)
module.exports = async (req, res) => {
  const SUPA = process.env.SUPABASE_URL;
  const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const FALLBACK = 'https://app.yuanfnb.com/shop';
  const PARTNER_HOST = 'partner.yuanfnb.com';
  const code = (req.query && req.query.code ? String(req.query.code) : '').trim();

  const go = (url) => { res.statusCode = 302; res.setHeader('Location', url); res.end(); };
  const isSafeCode = (s) => /^[a-z0-9-]{4,64}$/i.test(s);
  // 링크 미리보기(OG) 크롤러만 정밀 판별 — 네이버 Yeti, 카카오 scrap, 페북/트위터/슬랙 등.
  //   ※ 네이버·카카오 "인앱 브라우저"(실사용자) UA엔 naver/kakao가 들어가므로 넓게 매칭하지 않는다(클릭 집계 누락 방지).
  const BOT_RE = /(yeti|googlebot|bingbot|facebookexternalhit|facebot|twitterbot|slackbot|slack-imgproxy|telegrambot|discordbot|whatsapp|skypeuripreview|pinterest|embedly|redditbot|opengraph|metauri|externalhit|kakaotalk-scrap|\bscrap)/i;
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const normImg = (v) => { const s = String(v || '').trim(); if (/^https:\/\//i.test(s)) return s; if (s.startsWith('/')) return 'https://app.yuanfnb.com' + s; return ''; };
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
      fetch(SUPA + '/rest/v1/partner_links?select=id,product_url,product_id,product_name,product_image,product_price,title,partner_id,partners(status)&code=eq.' + encodeURIComponent(code), { headers }),
      fetch(SUPA + '/rest/v1/op_settings?select=value&key=eq.cookie_days', { headers }).catch(() => null)
    ]);
    let cookieDays = 30;
    try { const csr = cs && await cs.json(); if (Array.isArray(csr) && csr[0]) { const n = parseInt(csr[0].value, 10); if (n >= 1 && n <= 90) cookieDays = n; } } catch (e) {}
    const rows = await q.json();
    if (!Array.isArray(rows) || !rows.length) return go(FALLBACK);
    const link = rows[0];
    if (link.partners && link.partners.status === 'suspended') return go(FALLBACK);

    // ── 링크 미리보기 크롤러: 클릭 집계 없이 "상품 OG(이미지/이름/가격)"를 심은 HTML을 준다 ──
    //    (네이버 블로그·카카오 등에서 링크 카드에 상품 이미지가 떠서 클릭을 유도)
    const ua = String(req.headers['user-agent'] || '');
    if (BOT_RE.test(ua)) {
      let name = link.product_name || link.title || '온종일팜 상품';
      let image = normImg(link.product_image);
      let price = Number(link.product_price || 0);
      if (link.product_id) {
        try {
          const pr = await fetch(SUPA + '/rest/v1/products?select=name,retail_price,image_url&id=eq.' + encodeURIComponent(String(link.product_id)) + '&limit=1', { headers });
          if (pr.ok) { const pj = await pr.json(); const p = Array.isArray(pj) ? pj[0] : null; if (p) { if (p.name) name = p.name; if (p.image_url) image = normImg(p.image_url); if (p.retail_price) price = Number(p.retail_price); } }
        } catch (e) {}
      }
      const dest = safeDest(link.product_url);
      const priceTxt = (Number.isFinite(price) && price > 0) ? price.toLocaleString('ko-KR') + '원' : '';
      const desc = (priceTxt ? priceTxt + ' · ' : '') + '온종일팜에서 지금 바로 확인해보세요';
      const html = '<!doctype html><html lang="ko"><head><meta charset="utf-8">'
        + '<meta name="viewport" content="width=device-width, initial-scale=1">'
        + '<meta property="og:type" content="product">'
        + '<meta property="og:site_name" content="온종일팜">'
        + '<meta property="og:title" content="' + esc(name) + '">'
        + '<meta property="og:description" content="' + esc(desc) + '">'
        + (image ? '<meta property="og:image" content="' + esc(image) + '"><meta property="og:image:width" content="800"><meta property="og:image:height" content="800">' : '')
        + '<meta property="og:url" content="https://' + PARTNER_HOST + '/r/' + esc(code) + '">'
        + '<meta name="twitter:card" content="summary_large_image">'
        + '<meta name="twitter:title" content="' + esc(name) + '">'
        + '<meta name="twitter:description" content="' + esc(desc) + '">'
        + (image ? '<meta name="twitter:image" content="' + esc(image) + '">' : '')
        + '<title>' + esc(name) + '</title>'
        + '<meta http-equiv="refresh" content="0;url=' + esc(dest) + '"></head>'
        + '<body><a href="' + esc(dest) + '">' + esc(name) + '</a></body></html>';
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      // ★캐시 금지 + UA별 분리: 이 봇용 HTML이 엣지에 캐시돼 실사용자에게 잘못 전달되면
      //   리다이렉트/클릭집계가 깨진다. no-store로 절대 캐시되지 않게 한다.
      res.setHeader('Cache-Control', 'no-store, max-age=0');
      res.setHeader('Vary', 'User-Agent');
      return res.end(html);
    }

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
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Set-Cookie', 'op_ref=' + encodeURIComponent(code) + '; Max-Age=' + (cookieDays * 86400) + '; Path=/; SameSite=Lax; Secure');
    return go(dest);
  } catch (e) {
    return go(FALLBACK);
  }
};
