// 온파트너 상품 링크(/r/{code})의 OG용 "가로 AD 배너" 이미지(1200x630 PNG)를 생성한다.
// 네이버·카카오 등 링크 미리보기 카드가 정사각 대신 가로 배너로 보이게 하는 용도(퍼블리 없이 링크만 복사하는 사람용).
import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

// ※ env(SUPABASE_*)는 반드시 핸들러 안에서 읽는다 — 모듈 최상단에서 읽으면 edge에서 undefined라 302로 떨어졌음.
const FALLBACK_IMG = 'https://app.yuanfnb.com/og-image.png';

function normImg(v) {
  const s = String(v || '').trim();
  if (/^https:\/\//i.test(s)) return s;
  if (s.startsWith('/')) return 'https://app.yuanfnb.com' + s;
  return '';
}

// 완전한 한글 TTF(Do Hyeon, 단일파일)를 통째로 받는다.
//   ※ 구글폰트 &text= 서브셋 TTF는 satori가 파싱 못해 빈 이미지. GitHub raw는 rate-limit로 불안정.
//   → 우리 도메인 정적파일(assets/DoHyeon.ttf) 우선, 실패 시 GitHub 폴백.
const KO_FONT_URLS = [
  'https://partner.yuanfnb.com/assets/DoHyeon.ttf',
  'https://raw.githubusercontent.com/google/fonts/main/ofl/dohyeon/DoHyeon-Regular.ttf',
];
async function loadKoFont() {
  let lastErr;
  for (const u of KO_FONT_URLS) {
    try {
      const r = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (r.ok) { const ab = await r.arrayBuffer(); if (ab && ab.byteLength > 10000) return ab; }
      lastErr = new Error('font_' + r.status);
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('font_fail');
}

export default async function handler(req) {
  try {
    const SUPA = process.env.SUPABASE_URL;
    const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const url = new URL(req.url, 'https://partner.yuanfnb.com');
    const code = (url.searchParams.get('code') || '').trim();
    if (!/^[a-z0-9-]{4,64}$/i.test(code) || !SUPA || !SRK) return Response.redirect(FALLBACK_IMG, 302);

    const headers = { apikey: SRK, Authorization: 'Bearer ' + SRK };
    const rows = await (await fetch(SUPA + '/rest/v1/partner_links?select=product_id,product_name,product_image,product_price,title&code=eq.' + encodeURIComponent(code) + '&limit=1', { headers })).json();
    const link = Array.isArray(rows) ? rows[0] : null;
    if (!link) return Response.redirect(FALLBACK_IMG, 302);

    let name = link.product_name || link.title || '온종일팜 상품';
    let image = normImg(link.product_image);
    let price = Number(link.product_price || 0);
    if (link.product_id) {
      try {
        const pj = await (await fetch(SUPA + '/rest/v1/products?select=name,retail_price,image_url&id=eq.' + encodeURIComponent(String(link.product_id)) + '&limit=1', { headers })).json();
        const p = Array.isArray(pj) ? pj[0] : null;
        if (p) { if (p.name) name = p.name; if (p.image_url) image = normImg(p.image_url); if (p.retail_price) price = Number(p.retail_price); }
      } catch (e) {}
    }
    if (!image) return Response.redirect(FALLBACK_IMG, 302);

    const priceTxt = price > 0 ? price.toLocaleString('ko-KR') + '원' : '';
    const CTA = '지금 보러가기  →';
    const AD_LABEL = 'AD · 온종일팜';
    const LIVE = '지금 주문 가능';
    let font, fontErr = '';
    try { font = await loadKoFont(); } catch (fe) { fontErr = 'FONT:' + (fe && fe.message ? fe.message : String(fe)); }
    const noimg = url.searchParams.get('noimg') === '1';
    // satori는 이미지를 arrayBuffer로 미리 받아 data URL로 넘기면 훨씬 안정적(외부 fetch 실패/타임아웃 방지)
    let imgData = image;
    try {
      const ir = await fetch(image);
      const ab = await ir.arrayBuffer();
      const ct = ir.headers.get('content-type') || 'image/jpeg';
      let b64 = ''; const bytes = new Uint8Array(ab);
      for (let i = 0; i < bytes.length; i++) b64 += String.fromCharCode(bytes[i]);
      imgData = 'data:' + ct + ';base64,' + btoa(b64);
    } catch (ie) { imgData = ''; }

    // sq=1 → 정사각(네이버 블로그 카드용, 카드가 정사각 크롭하므로 온전히 보임), 아니면 가로(퍼블리 본문용)
    const square = url.searchParams.get('sq') === '1';
    const pinkDot = { type: 'div', props: { style: { display: 'flex', width: '20px', height: '20px', borderRadius: '50%', background: '#ff2d78', marginRight: '14px', boxShadow: '0 0 18px #ff2d78' } } };
    const adBadge = { type: 'div', props: { style: { position: 'absolute', top: '30px', left: '30px', display: 'flex', alignItems: 'center', background: 'rgba(17,24,39,0.82)', color: '#fff', fontSize: '26px', fontWeight: 800, padding: '8px 20px', borderRadius: '999px', letterSpacing: '1px' }, children: AD_LABEL } };

    let el;
    if (square) {
      // ── 정사각 1080x1080: 위 상품 이미지(정사각) + 아래 딥그린 패널 ──
      const imgBox = { type: 'div', props: { style: { display: 'flex', position: 'relative', width: '1080px', height: '620px' }, children:
        (!noimg && imgData)
          ? [ { type: 'img', props: { src: imgData, width: 1080, height: 620, style: { width: '1080px', height: '620px', objectFit: 'cover' } } }, adBadge ]
          : [ { type: 'div', props: { style: { display: 'flex', width: '1080px', height: '620px', background: '#f1f5f0', alignItems: 'center', justifyContent: 'center', fontSize: '160px' }, children: '🧺' } } ]
      } };
      const panel = { type: 'div', props: { style: { display: 'flex', flexDirection: 'column', width: '1080px', height: '460px', padding: '40px 54px', justifyContent: 'center', background: 'linear-gradient(135deg,#14532d 0%,#166534 55%,#0f3d22 100%)' }, children: [
        { type: 'div', props: { style: { display: 'flex', alignItems: 'center', marginBottom: '16px' }, children: [ pinkDot, { type: 'div', props: { style: { display: 'flex', color: '#ffd9e6', fontSize: '30px', fontWeight: 800, letterSpacing: '1px' }, children: LIVE } } ] } },
        { type: 'div', props: { style: { display: 'flex', color: '#fff', fontSize: '62px', fontWeight: 800, lineHeight: 1.1, marginBottom: '14px' }, children: name } },
        { type: 'div', props: { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [
          { type: 'div', props: { style: { display: 'flex', color: '#bef264', fontSize: '64px', fontWeight: 800 }, children: priceTxt || ' ' } },
          { type: 'div', props: { style: { display: 'flex', background: '#bef264', color: '#14310f', fontSize: '32px', fontWeight: 800, padding: '16px 34px', borderRadius: '999px' }, children: CTA } }
        ] } }
      ] } };
      el = { type: 'div', props: { style: { display: 'flex', flexDirection: 'column', width: '1080px', height: '1080px', background: '#fff', fontFamily: 'ko' }, children: [imgBox, panel] } };
    } else {
      // ── 가로 1200x630 (퍼블리 본문용) ──
      const leftChildren = (!noimg && imgData)
        ? [ { type: 'img', props: { src: imgData, width: 640, height: 630, style: { width: '640px', height: '630px', objectFit: 'cover' } } }, adBadge ]
        : [ { type: 'div', props: { style: { display: 'flex', width: '640px', height: '630px', background: '#f1f5f0', alignItems: 'center', justifyContent: 'center', fontSize: '120px' }, children: '🧺' } } ];
      const rightChildren = [
        { type: 'div', props: { style: { display: 'flex', alignItems: 'center', marginBottom: '26px' }, children: [ pinkDot, { type: 'div', props: { style: { display: 'flex', color: '#ffd9e6', fontSize: '30px', fontWeight: 800, letterSpacing: '1px' }, children: LIVE } } ] } },
        { type: 'div', props: { style: { display: 'flex', color: '#fff', fontSize: '64px', fontWeight: 800, lineHeight: 1.15, marginBottom: '22px' }, children: name } },
        priceTxt ? { type: 'div', props: { style: { display: 'flex', color: '#bef264', fontSize: '68px', fontWeight: 800, marginBottom: '40px' }, children: priceTxt } } : { type: 'div', props: { style: { display: 'flex', height: '20px' } } },
        { type: 'div', props: { style: { display: 'flex', alignSelf: 'flex-start', background: '#bef264', color: '#14310f', fontSize: '36px', fontWeight: 800, padding: '20px 46px', borderRadius: '999px' }, children: CTA } }
      ];
      el = { type: 'div', props: { style: { display: 'flex', width: '1200px', height: '630px', background: '#fff', fontFamily: 'ko' }, children: [
        { type: 'div', props: { style: { display: 'flex', position: 'relative', width: '640px', height: '630px' }, children: leftChildren } },
        { type: 'div', props: { style: { display: 'flex', flexDirection: 'column', flexGrow: 1, height: '630px', padding: '0 56px', justifyContent: 'center', background: 'linear-gradient(135deg,#14532d 0%,#166534 55%,#0f3d22 100%)' }, children: rightChildren } }
      ] } };
    }

    return new ImageResponse(el, {
      width: square ? 1080 : 1200,
      height: square ? 1080 : 630,
      fonts: font ? [{ name: 'ko', data: font, weight: 400, style: 'normal' }] : [],
      headers: { 'Cache-Control': 'public, max-age=600, s-maxage=86400' }
    });
  } catch (e) {
    return Response.redirect(FALLBACK_IMG, 302);
  }
}
