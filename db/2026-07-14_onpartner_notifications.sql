-- ═══════════════════════════════════════════════════════════
-- 온파트너 파트너 알림
-- 온종일팜 Supabase(SQL Editor)에서 실행하세요.
-- 기존 온종일팜 테이블/auth는 변경하지 않습니다.
-- ═══════════════════════════════════════════════════════════

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_partner_created_idx
  on notifications(partner_id, created_at desc);

alter table notifications enable row level security;

drop policy if exists notifications_select on notifications;
create policy notifications_select on notifications for select
  using (is_admin() or auth.uid() = partner_id);

drop policy if exists notifications_insert_admin on notifications;
create policy notifications_insert_admin on notifications for insert
  with check (is_admin());

drop policy if exists notifications_update_own on notifications;
create policy notifications_update_own on notifications for update
  using (auth.uid() = partner_id)
  with check (auth.uid() = partner_id);
