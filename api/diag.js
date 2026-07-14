// [임시 진단] 실제 저장된 파트너 데이터 확인용 — 확인 후 삭제
module.exports = async (req, res) => {
  const SUPA = process.env.SUPABASE_URL;
  const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = req.query && req.query.key;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (key !== 'op-diag-8ef') { res.statusCode = 403; res.end(JSON.stringify({ err: 'forbidden' })); return; }
  if (!SUPA || !SRK) { res.end(JSON.stringify({ err: 'no env' })); return; }
  const headers = { apikey: SRK, Authorization: 'Bearer ' + SRK };
  const out = {};
  try {
    const p = await fetch(SUPA + '/rest/v1/partners?select=id,email,name,nickname,phone,channels,categories,created_at&order=created_at.desc&limit=20', { headers });
    out.partners = await p.json();
  } catch (e) { out.partners_err = String(e); }
  try {
    const u = await fetch(SUPA + '/auth/v1/admin/users?per_page=20', { headers });
    const uj = await u.json();
    out.users = (uj.users || []).map(x => ({ email: x.email, meta: x.user_metadata, created: x.created_at }));
  } catch (e) { out.users_err = String(e); }
  res.end(JSON.stringify(out, null, 2));
};
