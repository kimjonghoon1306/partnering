// [임시] 테스트 계정 완전 삭제 — auth.users에서 지정 이메일 사용자 삭제(cascade로 partners 등 정리)
// 테리 테스트 계정 정리 전용. 처리 후 즉시 제거.
module.exports = async (req, res) => {
  const SUPA = process.env.SUPABASE_URL;
  const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = req.query && req.query.key;
  const email = req.query && req.query.email;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (key !== 'op-purge-2e11') { res.statusCode = 403; res.end(JSON.stringify({ err: 'forbidden' })); return; }
  if (!SUPA || !SRK) { res.end(JSON.stringify({ err: 'no env' })); return; }
  if (!email) { res.end(JSON.stringify({ err: 'email required' })); return; }
  const headers = { apikey: SRK, Authorization: 'Bearer ' + SRK, 'Content-Type': 'application/json' };
  try {
    // 이메일로 유저 찾기
    const q = await fetch(SUPA + '/auth/v1/admin/users?per_page=200', { headers });
    const qj = await q.json();
    const user = (qj.users || []).find(u => (u.email || '').toLowerCase() === String(email).toLowerCase());
    if (!user) { res.end(JSON.stringify({ ok: false, msg: 'user not found', email })); return; }
    const del = await fetch(SUPA + '/auth/v1/admin/users/' + user.id, { method: 'DELETE', headers });
    res.end(JSON.stringify({ ok: del.ok, status: del.status, email, id: user.id }, null, 2));
  } catch (e) { res.end(JSON.stringify({ err: String(e) })); }
};
