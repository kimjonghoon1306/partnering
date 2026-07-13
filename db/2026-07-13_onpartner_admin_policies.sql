begin;

-- 관리자(is_admin)가 온파트너 데이터를 직접 관리할 수 있도록 RLS 정책 추가
-- (온종일팜 기존 is_admin()=admin_users 기반 재사용)

-- 파트너 상태 변경(정지/활성) 등
drop policy if exists partners_admin_upd on partners;
create policy partners_admin_upd on partners for update using (is_admin()) with check (is_admin());

-- 전환 상태 변경(확정/취소/정산완료)
drop policy if exists conversions_admin_upd on conversions;
create policy conversions_admin_upd on conversions for update using (is_admin()) with check (is_admin());

-- 정산 생성/수정/지급
drop policy if exists settlements_admin_all on settlements;
create policy settlements_admin_all on settlements for all using (is_admin()) with check (is_admin());

-- (product_commissions 는 이미 is_admin insert/update/delete 정책 있음)

commit;
