// ── 온파트너 Supabase 클라이언트
// 로드 순서: supabase-js(CDN) → config.js → db.js
(function () {
  if (!window.supabase || !window.ONPARTNER_CONFIG) {
    console.error('[온파트너] Supabase SDK 또는 설정 로드 실패');
    return;
  }
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.ONPARTNER_CONFIG;
  window.opClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
})();

// 선택된 태그 값 배열 (예: #channel-tags 의 .selected)
function opSelectedTags(groupId) {
  return Array.from(document.querySelectorAll('#' + groupId + ' .tag-item.selected'))
    .map(t => t.dataset.val);
}

// partners row 존재 여부가 온파트너 가입 여부다.
async function opGetPartner(user) {
  if (!user || !window.opClient) return null;
  const { data, error } = await window.opClient
    .from('partners')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error) {
    console.warn('[온파트너] partners 조회 경고:', error.message);
    return null;
  }
  return data || null;
}

// 온파트너 가입/등록 시 partners 프로필 생성
// - info 있음: auth.users.id로 partners row 생성/갱신
// - info 없음: 로그인/세션 진입이므로 절대 자동 생성하지 않음
async function opEnsurePartner(user, info) {
  if (!user || !window.opClient) return null;
  const existing = await opGetPartner(user);
  if (!info) return existing;

  const m = user.user_metadata || {};
  const row = {
    id: user.id,
    email: user.email,
    name: (info && info.name) || m.name || '',
    nickname: (info && info.nickname) || m.nickname || null,
    phone: (info && info.phone) || m.phone || m.contact || null,   // 온종일팜 계정은 contact 키
    channels: (info && info.channels) || m.channels || [],
    categories: (info && info.categories) || m.categories || [],
    follower_scale: (info && info.follower_scale) || m.follower_scale || null,
  };
  const { data, error } = await window.opClient
    .from('partners')
    .upsert(row, { onConflict: 'id', ignoreDuplicates: false })
    .select('*')
    .maybeSingle();
  if (error) {
    console.warn('[온파트너] partners 저장 경고:', error.message);
    return existing;
  }
  return data || existing;
}
