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

    // ── /r/ 은 "상품 OG(이미지/이름/가격)"를 담은 페이지를 누구에게나 준다 ──
    //    · 크롤러(네이버 Yeti/블로그, 카카오, 페북 등): 이 OG만 읽어 링크 카드에 상품 이미지를 노출
    //    · 실사용자: 클릭 집계 + 전환추적 쿠키 후 즉시 상품페이지로 리다이렉트(JS+meta)
    //    ※ 예전엔 즉시 302라 크롤러가 리다이렉트를 따라가 도착지(SPA)의 기본 OG(관리시스템)를
    //      읽는 문제가 있었음 → UA 추측에 의존하지 않고 항상 상품 OG를 직접 준다.
    const ua = String(req.headers['user-agent'] || '');
    const isBot = BOT_RE.test(ua) || (/naver/i.test(ua) && !/inapp/i.test(ua));

    // 상품 정보(이름/이미지/가격) — 링크 저장값 우선, product_id 있으면 최신 상품으로 보강
    let name = link.product_name || link.title || '온종일팜 상품';
    let image = normImg(link.product_image);
    let price = Number(link.product_price || 0);
    if (link.product_id) {
      try {
        const pr = await fetch(SUPA + '/rest/v1/products?select=name,retail_price,image_url&id=eq.' + encodeURIComponent(String(link.product_id)) + '&limit=1', { headers });
        if (pr.ok) { const pj = await pr.json(); const p = Array.isArray(pj) ? pj[0] : null; if (p) { if (p.name) name = p.name; if (p.image_url) image = normImg(p.image_url); if (p.retail_price) price = Number(p.retail_price); } }
      } catch (e) {}
    }
    const priceTxt = (Number.isFinite(price) && price > 0) ? price.toLocaleString('ko-KR') + '원' : '';
    const desc = (priceTxt ? priceTxt + ' · ' : '') + '온종일팜에서 지금 바로 확인해보세요';
    const base = safeDest(link.product_url);
    const dest = base + (base.includes('?') ? '&' : '?') + 'op_ref=' + encodeURIComponent(code);

    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Vary', 'User-Agent');

    if (!isBot) {
      // 실사용자만: 클릭 기록 + 카운트 증가 + 전환추적 쿠키 (실패해도 이동은 진행)
      fetch(SUPA + '/rest/v1/link_clicks', {
        method: 'POST', headers,
        body: JSON.stringify({ link_id: link.id, referer: req.headers['referer'] || req.headers['referrer'] || null, user_agent: ua || null })
      }).catch(() => {});
      fetch(SUPA + '/rest/v1/rpc/op_increment_click', { method: 'POST', headers, body: JSON.stringify({ p_link: link.id }) }).catch(() => {});
      res.setHeader('Set-Cookie', 'op_ref=' + encodeURIComponent(code) + '; Max-Age=' + (cookieDays * 86400) + '; Path=/; SameSite=Lax; Secure');
    }

    // 사람에겐 즉시 리다이렉트(JS+meta), 크롤러에겐 리다이렉트 없이 OG만
    const redirectHead = isBot ? '' : '<meta http-equiv="refresh" content="0;url=' + esc(dest) + '">';
    const redirectScript = isBot ? '' : '<script>location.replace(' + JSON.stringify(dest) + ');</script>';
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
      + redirectHead + redirectScript + '</head>'
      + '<body style="font-family:-apple-system,sans-serif;text-align:center;padding:48px 20px;color:#444">'
      + (image ? '<img src="' + esc(image) + '" alt="' + esc(name) + '" style="max-width:280px;width:100%;border-radius:14px">' : '')
      + '<h1 style="font-size:18px;margin:18px 0 6px">' + esc(name) + '</h1>'
      + (priceTxt ? '<p style="font-size:16px;font-weight:700;color:#e5457a;margin:0 0 14px">' + esc(priceTxt) + '</p>' : '')
      + '<p><a href="' + esc(dest) + '" style="display:inline-block;background:#e5457a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700">상품 보러가기 →</a></p>'
      + '</body></html>';
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(html);
  } catch (e) {
    return go(FALLBACK);
  }
};
