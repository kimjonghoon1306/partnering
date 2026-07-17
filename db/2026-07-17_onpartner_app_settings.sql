-- 온파트너 전역 설정 테이블 (관리자가 화면에서 조정)
-- ⚠️ 이름이 op_settings인 이유: app_settings는 온종일팜/캐시포인트가 이미 사용중(value jsonb). 충돌 방지.
create table if not exists op_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table op_settings enable row level security;
-- 읽기: 모두(파트너 화면·서버함수 표시용). 값은 민감정보 아님.
drop policy if exists op_settings_sel on op_settings;
create policy op_settings_sel on op_settings for select using (true);
-- 쓰기: 관리자만
drop policy if exists op_settings_write on op_settings;
create policy op_settings_write on op_settings for all using (is_admin()) with check (is_admin());
-- 기본값 시드(이미 있으면 유지)
insert into op_settings(key, value) values
  ('default_commission_rate', '5'),
  ('min_withdrawal', '10000'),
  ('settlement_notice', '매월 15일 정산 (전월 확정 수수료 기준)'),
  ('cookie_days', '30')
on conflict (key) do nothing;
