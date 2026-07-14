// [임시] 온파트너 탈퇴 — partners row 삭제(FK cascade로 links/conversions/settlements 정리)
// auth.users(온종일팜 공유 계정)는 건드리지 않음. 처리 후 삭제.
module.exports = async (req, res) => {
  const SUPA = process.env.SUPABASE_URL;
  const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = req.query && req.query.key;
  const email = req.query && req.query.email;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (key !== 'op-unreg-91f') { res.statusCode = 403; res.end(JSON.stringify({ err: 'forbidden' })); return; }
  if (!SUPA || !SRK) { res.end(JSON.stringify({ err: 'no env' })); return; }
  if (!email) { res.end(JSON.stringify({ err: 'email required' })); return; }
  const headers = { apikey: SRK, Authorization: 'Bearer ' + SRK, 'Content-Type': 'application/json', Prefer: 'return=representation' };
  try {
    const del = await fetch(SUPA + '/rest/v1/partners?email=eq.' + encodeURIComponent(email), { method: 'DELETE', headers });
    const deleted = await del.json();
    res.end(JSON.stringify({ ok: true, email, deleted }, null, 2));
  } catch (e) { res.end(JSON.stringify({ err: String(e) })); }
};
