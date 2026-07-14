// 온파트너 셀프 탈퇴: 요청자 본인 계정(auth.users)을 완전 삭제한다.
// - Authorization 헤더의 access_token으로 "본인"을 검증한 뒤, 그 본인 id만 삭제.
// - auth.users 삭제 시 FK cascade로 partners/partner_links/conversions/settlements 등 정리.
// - 계정이 삭제되므로 같은 이메일로 재가입이 자유롭게 가능.
module.exports = async (req, res) => {
  const SUPA = process.env.SUPABASE_URL;
  const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ ok: false, err: 'method' })); return; }
  if (!SUPA || !SRK) { res.statusCode = 500; res.end(JSON.stringify({ ok: false, err: 'server not configured' })); return; }

  // 요청자 토큰 추출
  const auth = req.headers['authorization'] || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) { res.statusCode = 401; res.end(JSON.stringify({ ok: false, err: '로그인이 필요해요' })); return; }

  try {
    // 1) 토큰으로 본인 확인 (남의 계정 삭제 불가)
    const me = await fetch(SUPA + '/auth/v1/user', {
      headers: { apikey: SRK, Authorization: 'Bearer ' + token }
    });
    if (!me.ok) { res.statusCode = 401; res.end(JSON.stringify({ ok: false, err: '세션이 만료됐어요. 다시 로그인해주세요' })); return; }
    const user = await me.json();
    if (!user || !user.id) { res.statusCode = 401; res.end(JSON.stringify({ ok: false, err: '본인 확인 실패' })); return; }

    // 2) service_role로 본인 계정 완전 삭제
    const del = await fetch(SUPA + '/auth/v1/admin/users/' + user.id, {
      method: 'DELETE',
      headers: { apikey: SRK, Authorization: 'Bearer ' + SRK }
    });
    if (!del.ok) {
      res.statusCode = 500;
      res.end(JSON.stringify({ ok: false, err: '탈퇴 처리 실패' }));
      return;
    }
    res.end(JSON.stringify({ ok: true }));
  } catch (e) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, err: 'server error' }));
  }
};
