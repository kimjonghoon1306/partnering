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

// 구글폰트에서 "필요한 글자만" subset TTF로 받는다(구형 UA로 요청해야 woff2 대신 ttf 반환).
async function loadKoFont(text) {
  const api = 'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@800&text=' + encodeURIComponent(text);
  const css = await (await fetch(api, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36' } })).text();
  // 구글폰트는 ttf(...ttf) 또는 subset(.../l/font?kit=...) 형태로 URL을 준다 — 둘 다 잡는다.
  const m = css.match(/src:\s*url\((https:\/\/[^)]+)\)/);
  if (!m) throw new Error('font_url_not_found');
  return await (await fetch(m[1])).arrayBuffer();
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
    const charset = name + '지금 주문 가능 AD 지금 보러가기 온종일팜 ▶ ' + priceTxt + '0123456789';
    let font, fontErr = '';
    try { font = await loadKoFont(charset); } catch (fe) { fontErr = 'FONT:' + (fe && fe.message ? fe.message : String(fe)); }
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

    // ── 애드포스트보다 예쁜 배너: 상품 크게(좌) + 딥그린 그라데이션 패널(우) + 핑크 포인트 ──
    const leftChildren = [];
    if (!noimg && imgData) {
      leftChildren.push({ type: 'img', props: { src: imgData, width: 640, height: 630, style: { width: '640px', height: '630px', objectFit: 'cover' } } });
      // 이미지 위 좌상단 그라데이션 그림자 + AD 배지
      leftChildren.push({ type: 'div', props: { style: { position: 'absolute', top: '34px', left: '34px', display: 'flex', alignItems: 'center', background: 'rgba(17,24,39,0.82)', color: '#fff', fontSize: '26px', fontWeight: 800, padding: '8px 20px', borderRadius: '999px', letterSpacing: '1px' }, children: 'AD · 온종일팜' } });
    } else {
      leftChildren.push({ type: 'div', props: { style: { display: 'flex', width: '640px', height: '630px', background: '#f1f5f0', alignItems: 'center', justifyContent: 'center', fontSize: '120px' }, children: '🧺' } });
    }

    const rightChildren = [
      // 핑크 라이브 점 + 문구
      { type: 'div', props: { style: { display: 'flex', alignItems: 'center', marginBottom: '26px' }, children: [
        { type: 'div', props: { style: { display: 'flex', width: '20px', height: '20px', borderRadius: '50%', background: '#ff2d78', marginRight: '14px', boxShadow: '0 0 18px #ff2d78' } } },
        { type: 'div', props: { style: { display: 'flex', color: '#ffd9e6', fontSize: '30px', fontWeight: 800, letterSpacing: '1px' }, children: '지금 주문 가능' } }
      ] } },
      // 상품명
      { type: 'div', props: { style: { display: 'flex', color: '#ffffff', fontSize: '64px', fontWeight: 800, lineHeight: 1.15, marginBottom: '22px' }, children: name } },
    ];
    if (priceTxt) {
      rightChildren.push({ type: 'div', props: { style: { display: 'flex', alignItems: 'baseline', marginBottom: '40px' }, children: [
        { type: 'div', props: { style: { display: 'flex', color: '#bef264', fontSize: '68px', fontWeight: 800 }, children: priceTxt } }
      ] } });
    } else {
      rightChildren.push({ type: 'div', props: { style: { display: 'flex', height: '20px' } } });
    }
    // CTA 버튼(라임)
    rightChildren.push({ type: 'div', props: { style: { display: 'flex', alignSelf: 'flex-start', background: '#bef264', color: '#14310f', fontSize: '36px', fontWeight: 800, padding: '20px 46px', borderRadius: '999px' }, children: '지금 보러가기  →' } });

    const el = {
      type: 'div',
      props: {
        style: { display: 'flex', width: '1200px', height: '630px', background: '#ffffff', fontFamily: 'ko' },
        children: [
          { type: 'div', props: { style: { display: 'flex', position: 'relative', width: '640px', height: '630px' }, children: leftChildren } },
          { type: 'div', props: { style: { display: 'flex', flexDirection: 'column', flexGrow: 1, height: '630px', padding: '0 56px', justifyContent: 'center', background: 'linear-gradient(135deg,#14532d 0%,#166534 55%,#0f3d22 100%)' }, children: rightChildren } }
        ]
      }
    };

    return new ImageResponse(el, {
      width: 1200,
      height: 630,
      fonts: [{ name: 'ko', data: font, weight: 800, style: 'normal' }],
      headers: { 'Cache-Control': 'public, max-age=600, s-maxage=86400' }
    });
  } catch (e) {
    return Response.redirect(FALLBACK_IMG, 302);
  }
}
