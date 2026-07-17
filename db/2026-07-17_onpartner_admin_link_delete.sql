-- 관리자가 어떤 파트너 링크든 삭제할 수 있게 (부정·테스트 잔재 정리용)
-- 기존 plinks_del(본인만)은 유지하고, 관리자용 삭제 정책을 추가한다.
drop policy if exists plinks_admin_del on partner_links;
create policy plinks_admin_del on partner_links for delete using (is_admin());
