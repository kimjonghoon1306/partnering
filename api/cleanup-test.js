// [임시] 테스트 계정 일괄 정리 — @example.com 이메일 auth 유저 전부 삭제(cascade로 partners 등)
// 실사용자(naver/gmail 등)는 건드리지 않음. 처리 후 제거.
module.exports = async (req, res) => {
  const SUPA = process.env.SUPABASE_URL;
  const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const key = req.query && req.query.key;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  if (key !== 'op-cleanup-39cf') { res.statusCode = 403; res.end(JSON.stringify({ err: 'forbidden' })); return; }
  if (!SUPA || !SRK) { res.end(JSON.stringify({ err: 'no env' })); return; }
  const headers = { apikey: SRK, Authorization: 'Bearer ' + SRK, 'Content-Type': 'application/json' };
  const deleted = [];
  const failed = [];
  try {
    // 페이지네이션으로 전체 유저 조회
    let page = 1, all = [];
    while (page <= 10) {
      const r = await fetch(SUPA + '/auth/v1/admin/users?per_page=200&page=' + page, { headers });
      const j = await r.json();
      const us = j.users || [];
      all = all.concat(us);
      if (us.length < 200) break;
      page++;
    }
    // @example.com 만 대상
    const targets = all.filter(u => /@example\.com$/i.test(u.email || ''));
    for (const u of targets) {
      const d = await fetch(SUPA + '/auth/v1/admin/users/' + u.id, { method: 'DELETE', headers });
      if (d.ok) deleted.push(u.email); else failed.push(u.email);
    }
    res.end(JSON.stringify({ ok: true, total_users: all.length, deleted_count: deleted.length, deleted, failed }, null, 2));
  } catch (e) {
    res.end(JSON.stringify({ ok: false, err: String(e), deleted }));
  }
};
