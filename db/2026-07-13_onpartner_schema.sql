-- ═══════════════════════════════════════════════════════════
-- 온파트너 제휴마케팅 백엔드 스키마
-- 온종일팜 Supabase(SQL Editor)에서 1회 실행하세요.
-- 관리자 판별은 온종일팜 기존 is_admin() 함수를 재사용합니다.
-- 클릭/전환/정산 insert는 서버함수(service role)로만 → 위조 방지.
-- ═══════════════════════════════════════════════════════════

-- 1) 파트너 프로필 (auth.users 와 1:1)
create table if not exists partners (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  phone text,
  channel text,                 -- 주 활동 채널(인스타/블로그/유튜브 등)
  bank_name text,               -- 정산 계좌
  bank_account text,
  bank_holder text,
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now()
);
alter table partners enable row level security;
drop policy if exists partners_select on partners;
create policy partners_select on partners for select
  using (is_admin() or auth.uid() = id);
drop policy if exists partners_insert on partners;
create policy partners_insert on partners for insert
  with check (auth.uid() = id);
drop policy if exists partners_update on partners;
create policy partners_update on partners for update
  using (auth.uid() = id) with check (auth.uid() = id);
-- 관리자 상태변경(suspend)은 서버함수(service role)로 처리.

-- 2) 제휴 링크
create table if not exists partner_links (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  code text not null unique,                          -- 단축코드 on.partner/r/{code}
  product_url text not null,                          -- 온종일팜 상품 URL
  title text,
  commission_rate numeric(5,4) not null default 0.05, -- 수수료율(기본 5%)
  clicks int not null default 0,
  conversions int not null default 0,
  created_at timestamptz not null default now()
);
alter table partner_links enable row level security;
create index if not exists partner_links_partner_idx on partner_links(partner_id, created_at desc);
create index if not exists partner_links_code_idx on partner_links(code);
drop policy if exists partner_links_select on partner_links;
create policy partner_links_select on partner_links for select
  using (is_admin() or auth.uid() = partner_id);
drop policy if exists partner_links_insert on partner_links;
create policy partner_links_insert on partner_links for insert
  with check (auth.uid() = partner_id);
drop policy if exists partner_links_update on partner_links;
create policy partner_links_update on partner_links for update
  using (auth.uid() = partner_id) with check (auth.uid() = partner_id);
drop policy if exists partner_links_delete on partner_links;
create policy partner_links_delete on partner_links for delete
  using (auth.uid() = partner_id);

-- 3) 클릭 로그 (익명 방문자 → 서버함수 service role 로만 insert)
create table if not exists link_clicks (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references partner_links(id) on delete cascade,
  ip_hash text,
  referer text,
  user_agent text,
  clicked_at timestamptz not null default now()
);
alter table link_clicks enable row level security;
create index if not exists link_clicks_link_idx on link_clicks(link_id, clicked_at desc);
drop policy if exists link_clicks_select on link_clicks;
create policy link_clicks_select on link_clicks for select using (
  is_admin() or exists (
    select 1 from partner_links l where l.id = link_id and l.partner_id = auth.uid()
  )
);
-- insert 정책 없음 → service role(서버함수)만 기록 가능. 위조 방지.

-- 4) 전환 (구매 → 수수료). tracker → 서버함수(service role) insert.
create table if not exists conversions (
  id uuid primary key default gen_random_uuid(),
  link_id uuid references partner_links(id) on delete set null,
  partner_id uuid not null references partners(id) on delete cascade,
  order_id uuid not null,
  order_type text not null check (order_type in ('general','retail','wholesale')),
  order_amount numeric(12,2) not null,
  commission_rate numeric(5,4) not null,
  commission_amount numeric(12,2) not null,
  status text not null default 'pending'
    check (status in ('pending','confirmed','canceled','settled')),
  created_at timestamptz not null default now(),
  unique (order_id, order_type)   -- 주문당 1전환(중복 적립 방지)
);
alter table conversions enable row level security;
create index if not exists conversions_partner_idx on conversions(partner_id, created_at desc);
create index if not exists conversions_status_idx on conversions(status, created_at desc);
drop policy if exists conversions_select on conversions;
create policy conversions_select on conversions for select
  using (is_admin() or auth.uid() = partner_id);
-- insert/update 정책 없음 → service role(서버함수)만. 위조 방지.

-- 5) 정산 (월별 집계)
create table if not exists settlements (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  period text not null,                  -- 'YYYY-MM'
  total_amount numeric(12,2) not null default 0,
  status text not null default 'pending' check (status in ('pending','paid')),
  bank_snapshot text,                    -- 정산 시점 계좌 스냅샷
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (partner_id, period)
);
alter table settlements enable row level security;
create index if not exists settlements_partner_idx on settlements(partner_id, period desc);
drop policy if exists settlements_select on settlements;
create policy settlements_select on settlements for select
  using (is_admin() or auth.uid() = partner_id);
-- insert/update 정책 없음 → service role(관리자 정산처리)만.

-- 끝. 5개 테이블 + RLS 완료.
