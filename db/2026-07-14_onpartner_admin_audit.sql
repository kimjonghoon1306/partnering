-- 온파트너 관리자 액션 감사 로그
-- Supabase SQL Editor에서 실행하세요. 관리자 판별은 기존 is_admin() 함수를 재사용합니다.

create table if not exists admin_audit_log (
  id bigserial primary key,
  admin_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id text,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_at_idx
  on admin_audit_log (created_at desc);

create index if not exists admin_audit_log_target_idx
  on admin_audit_log (target_type, target_id);

alter table admin_audit_log enable row level security;

drop policy if exists admin_audit_log_select_admin on admin_audit_log;
create policy admin_audit_log_select_admin
  on admin_audit_log for select
  using (is_admin());

drop policy if exists admin_audit_log_insert_admin on admin_audit_log;
create policy admin_audit_log_insert_admin
  on admin_audit_log for insert
  with check (is_admin());
