-- 관리자가 파트너를 삭제할 수 있게 (테스트/부정 회원 정리용)
-- partners 삭제 시 FK cascade로 partner_links·conversions·settlements·notifications 등 온파트너 데이터가 함께 정리됨.
-- auth.users(온종일팜 계정)는 유지되므로 공유 DB에 안전.
drop policy if exists partners_admin_del on partners;
create policy partners_admin_del on partners for delete using (is_admin());
