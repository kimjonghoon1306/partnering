// 온파트너 전환 추적: 온종일팜 구매완료 → 수수료 적립
// tracker.js가 { code, order_id, order_type, amount } 를 POST
module.exports = async (req, res) => {
  const SUPA = process.env.SUPABASE_URL;
  const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // CORS (온종일팜 등 다른 도메인에서 호출)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.statusCode = 204; res.end(); return; }

  const ok = (obj) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(obj || { ok: true }));
  };
  const isAllowedOrigin = () => {
    const raw = req.headers.origin || req.headers.referer || '';
    if (!raw) return true;
    try {
      const u = new URL(raw);
      return u.protocol === 'https:' && (u.hostname === 'app.yuanfnb.com' || u.hostname.endsWith('.yuanfnb.com'));
    } catch (e) {
      return false;
    }
  };
  if (req.method !== 'POST') return ok({ ok: false, reason: 'method' });
  if (!SUPA || !SRK) return ok({ ok: false, reason: 'no-config' });
  if (!isAllowedOrigin()) return ok({ ok: false, reason: 'origin' });

  // body 파싱 (Vercel req.body 또는 raw stream)
  let body = req.body;
  if (body == null || typeof body === 'string') {
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
    else {
      try {
        const chunks = []; for await (const c of req) chunks.push(c);
        body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
      } catch (e) { body = {}; }
    }
  }
  body = body || {};

  const code = String(body.code || body.op_ref || '').trim();
  const orderId = String(body.order_id || body.orderId || '').trim();
  const orderType = String(body.order_type || body.orderType || 'general').trim();
  const amount = Number(body.amount || body.order_amount || 0);
  if (!code || !orderId || !amount) return ok({ ok: false, reason: 'missing' });
  if (!/^[a-z0-9-]{4,64}$/i.test(code)) return ok({ ok: false, reason: 'code' });
  if (orderId.length > 128) return ok({ ok: false, reason: 'order_id' });
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) return ok({ ok: false, reason: 'amount' });
  if (['general', 'retail', 'wholesale'].indexOf(orderType) < 0) return ok({ ok: false, reason: 'order_type' });

  try {
    const headers = { apikey: SRK, Authorization: 'Bearer ' + SRK, 'Content-Type': 'application/json' };
    const q = await fetch(SUPA + '/rest/v1/partner_links?select=id,partner_id,product_id,commission_rate,partners(status)&code=eq.' + encodeURIComponent(code), { headers });
    const rows = await q.json();
    if (!Array.isArray(rows) || !rows.length) return ok({ ok: false, reason: 'no-link' });
    const link = rows[0];
    if (link.partners && link.partners.status === 'suspended') return ok({ ok: false, reason: 'suspended' });
    const baseRate = Number(link.commission_rate) || 0.05;
    let bonusRate = 0;
    const today = new Date().toISOString().slice(0, 10);
    const campUrl = SUPA + '/rest/v1/campaigns?select=title,bonus_rate,target_type,target_value&is_active=eq.true&starts_at=lte.' + encodeURIComponent(today) + '&ends_at=gte.' + encodeURIComponent(today);
    const campRes = await fetch(campUrl, { headers });
    const campaigns = campRes.ok ? await campRes.json() : [];
    let productCategory = null;
    const needsCategory = Array.isArray(campaigns) && campaigns.some(c => c.target_type === 'category');
    if (needsCategory && link.product_id) {
      const productId = encodeURIComponent(String(link.product_id));
      for (const col of ['category_id', 'category']) {
        const pRes = await fetch(SUPA + '/rest/v1/products?select=' + col + '&id=eq.' + productId + '&limit=1', { headers });
        if (!pRes.ok) continue;
        const pRows = await pRes.json();
        if (Array.isArray(pRows) && pRows[0] && pRows[0][col] != null) {
          productCategory = String(pRows[0][col]);
          break;
        }
      }
    }
    if (Array.isArray(campaigns)) {
      campaigns.forEach(c => {
        const targetType = c.target_type || 'all';
        const targetValue = c.target_value == null ? '' : String(c.target_value);
        const matches = targetType === 'all' ||
          (targetType === 'product' && link.product_id && targetValue === String(link.product_id)) ||
          (targetType === 'category' && productCategory && targetValue === productCategory);
        if (matches) bonusRate = Math.max(bonusRate, Number(c.bonus_rate) || 0);
      });
    }
    const rate = baseRate + bonusRate;
    const commission = Math.round(amount * rate);

    const ins = await fetch(SUPA + '/rest/v1/conversions', {
      method: 'POST',
      headers: Object.assign({}, headers, { Prefer: 'return=minimal' }),
      body: JSON.stringify({
        link_id: link.id, partner_id: link.partner_id,
        order_id: orderId, order_type: orderType, order_amount: amount,
        commission_rate: rate, commission_amount: commission, status: 'pending'
      })
    });
    // 201=새 전환, 409=이미 기록된 주문(중복 방지)
    if (ins.status === 201) {
      fetch(SUPA + '/rest/v1/rpc/op_increment_conversion', {
        method: 'POST', headers, body: JSON.stringify({ p_link: link.id })
      }).catch(() => {});
      return ok({ ok: true, commission: commission });
    }
    if (ins.status === 409) return ok({ ok: true, duplicate: true });
    return ok({ ok: false, reason: 'insert', status: ins.status });
  } catch (e) {
    return ok({ ok: false, reason: 'error' });
  }
};
