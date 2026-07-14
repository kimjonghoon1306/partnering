begin;

-- 온파트너 셀프 탈퇴: auth.users는 유지하고 본인 partners row만 삭제한다.
drop policy if exists partners_del on partners;
create policy partners_del on partners for delete using (auth.uid() = id);

commit;
