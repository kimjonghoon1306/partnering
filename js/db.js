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

// 로그인/가입 후 partners 프로필 보장 (없으면 metadata 기반 생성)
async function opEnsurePartner(user, info) {
  if (!user) return;
  const m = user.user_metadata || {};
  const row = {
    id: user.id,
    email: user.email,
    name: (info && info.name) || m.name || '',
    nickname: (info && info.nickname) || m.nickname || null,
    channels: (info && info.channels) || m.channels || [],
    categories: (info && info.categories) || m.categories || [],
    follower_scale: (info && info.follower_scale) || m.follower_scale || null,
  };
  const { error } = await window.opClient
    .from('partners')
    .upsert(row, { onConflict: 'id', ignoreDuplicates: false });
  if (error) console.warn('[온파트너] partners 저장 경고:', error.message);
}
