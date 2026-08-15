// 공개 상품 카드 조회 API
// 온파트너 추천 링크(/r/{code})를 Publy 등 콘텐츠 도구에서 안전하게 미리보기할 때 사용한다.
const PARTNER_HOST = 'partner.yuanfnb.com';
const LEGACY_HOSTS = new Set(['partnering.vercel.app', PARTNER_HOST]);

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', status === 200 ? 'public, max-age=60, s-maxage=300' : 'no-store');
  res.end(JSON.stringify(body));
}

function extractCode(value) {
  const raw = String(value || '').trim();
  if (/^[a-z0-9-]{4,64}$/i.test(raw)) return raw;
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' || !LEGACY_HOSTS.has(url.hostname)) return '';
    const match = url.pathname.match(/^\/r\/([a-z0-9-]{4,64})\/?$/i);
    return match ? match[1] : '';
  } catch (_) {
    return '';
  }
}

function normalizeFarmImage(value) {
  const image = String(value || '').trim();
  if (/^https:\/\//i.test(image)) return image;
  if (image.startsWith('/')) return 'https://app.yuanfnb.com' + image;
  return '';
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return sendJson(res, 204, {});
  if (req.method !== 'GET') return sendJson(res, 405, { ok: false, error: 'method_not_allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const code = extractCode(req.query && (req.query.url || req.query.code));
  if (!code) return sendJson(res, 400, { ok: false, error: 'invalid_partner_link' });
  if (!supabaseUrl || !serviceKey) return sendJson(res, 503, { ok: false, error: 'service_unavailable' });

  try {
    const headers = { apikey: serviceKey, Authorization: 'Bearer ' + serviceKey };
    const linkResponse = await fetch(
      supabaseUrl + '/rest/v1/partner_links?select=code,product_id,product_url,product_name,product_image,product_price,title,partners(status)&code=eq.' + encodeURIComponent(code) + '&limit=1',
      { headers }
    );
    if (!linkResponse.ok) return sendJson(res, 502, { ok: false, error: 'lookup_failed' });
    const links = await linkResponse.json();
    const link = Array.isArray(links) ? links[0] : null;
    if (!link || (link.partners && link.partners.status === 'suspended')) {
      return sendJson(res, 404, { ok: false, error: 'link_not_found' });
    }

    let product = null;
    if (link.product_id) {
      const productResponse = await fetch(
        supabaseUrl + '/rest/v1/products?select=id,name,retail_price,image_url,is_active&id=eq.' + encodeURIComponent(String(link.product_id)) + '&limit=1',
        { headers }
      );
      if (productResponse.ok) {
        const products = await productResponse.json();
        product = Array.isArray(products) ? products[0] : null;
      }
    }

    const name = (product && product.name) || link.product_name || link.title || '온종일팜 상품';
    const price = Number((product && product.retail_price) ?? link.product_price ?? 0);
    const image = normalizeFarmImage((product && product.image_url) || link.product_image);
    return sendJson(res, 200, {
      ok: true,
      product: {
        id: link.product_id || null,
        name: String(name),
        image: String(image || ''),
        price: Number.isFinite(price) && price > 0 ? price : null,
        available: product ? product.is_active !== false : true,
        partnerUrl: 'https://' + PARTNER_HOST + '/r/' + code,
        shopUrl: String(link.product_url || '')
      }
    });
  } catch (_) {
    return sendJson(res, 500, { ok: false, error: 'server_error' });
  }
};
