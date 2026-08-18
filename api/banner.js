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
    const font = await loadKoFont(charset);

    const el = {
      type: 'div',
      props: {
        style: { display: 'flex', width: '1200px', height: '630px', background: '#ffffff', fontFamily: 'ko' },
        children: [
          // 왼쪽 상품 이미지 (정사각 cover)
          { type: 'div', props: { style: { display: 'flex', width: '630px', height: '630px' }, children: [
            { type: 'img', props: { src: image, width: 630, height: 630, style: { width: '630px', height: '630px', objectFit: 'cover' } } }
          ] } },
          // 오른쪽 패널
          { type: 'div', props: { style: { display: 'flex', flexDirection: 'column', flexGrow: 1, padding: '56px 48px', position: 'relative', justifyContent: 'center' }, children: [
            // AD 배지
            { type: 'div', props: { style: { position: 'absolute', top: '40px', right: '44px', display: 'flex', background: '#111827', color: '#ffffff', fontSize: '30px', fontWeight: 800, padding: '6px 20px', borderRadius: '12px' }, children: 'AD' } },
            // 핑크 라이브
            { type: 'div', props: { style: { display: 'flex', alignItems: 'center', marginBottom: '20px' }, children: [
              { type: 'div', props: { style: { display: 'flex', width: '18px', height: '18px', borderRadius: '50%', background: '#ff2d78', marginRight: '12px' } } },
              { type: 'div', props: { style: { display: 'flex', color: '#ff2d78', fontSize: '30px', fontWeight: 800 }, children: '지금 주문 가능' } }
            ] } },
            // 상품명
            { type: 'div', props: { style: { display: 'flex', color: '#111827', fontSize: '60px', fontWeight: 800, lineHeight: 1.15, marginBottom: '18px' }, children: name } },
            // 가격
            priceTxt
              ? { type: 'div', props: { style: { display: 'flex', color: '#e5457a', fontSize: '54px', fontWeight: 800, marginBottom: '34px' }, children: priceTxt } }
              : { type: 'div', props: { style: { display: 'flex', height: '10px' } } },
            // CTA
            { type: 'div', props: { style: { display: 'flex', alignSelf: 'flex-start', background: '#16a34a', color: '#ffffff', fontSize: '34px', fontWeight: 800, padding: '18px 40px', borderRadius: '18px' }, children: '지금 보러가기 ▶' } }
          ] } }
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
