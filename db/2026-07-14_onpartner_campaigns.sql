-- ══════════════════════════════════════════════
-- 온파트너 시즌 캠페인 (명절·제철·김장철 등 기간 한정 추가 수수료)
-- 온종일팜 Supabase에서 실행 (is_admin() 재사용)
-- ══════════════════════════════════════════════
begin;

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,                 -- 예: "설 명절 선물세트 캠페인"
  description text,                     -- 파트너에게 보여줄 설명
  emoji text default '🎁',
  target_type text not null default 'all'
    check (target_type in ('all','category','product')),
  target_value text,                   -- category=카테고리명 / product=상품id / all=null
  bonus_rate numeric(5,4) not null default 0,   -- 추가 수수료율(예: 0.03 = +3%p)
  starts_at date not null,
  ends_at date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table campaigns
  drop constraint if exists campaigns_bonus_rate_range;
alter table campaigns
  add constraint campaigns_bonus_rate_range
  check (bonus_rate >= 0 and bonus_rate <= 0.30) not valid;

alter table campaigns enable row level security;

-- 조회: 누구나(파트너 대시보드 노출용). write: 관리자만.
drop policy if exists campaigns_sel on campaigns;
create policy campaigns_sel on campaigns for select using (true);

drop policy if exists campaigns_admin on campaigns;
create policy campaigns_admin on campaigns for all using (is_admin()) with check (is_admin());

create index if not exists campaigns_active_idx on campaigns(is_active, ends_at desc);

commit;
