begin;

drop table if exists settlements, conversions, link_clicks, partner_links, partners cascade;

create table partners (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  nickname text,
  phone text,
  channels text[] not null default '{}',
  categories text[] not null default '{}',
  follower_scale text,
  bank_name text,
  bank_account text,
  bank_holder text,
  status text not null default 'active' check (status in ('active','suspended')),
  created_at timestamptz not null default now()
);
alter table partners enable row level security;
create policy partners_sel on partners for select using (is_admin() or auth.uid() = id);
create policy partners_ins on partners for insert with check (auth.uid() = id);
create policy partners_upd on partners for update using (auth.uid() = id) with check (auth.uid() = id);

create table partner_links (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  code text not null unique,
  product_url text not null,
  title text,
  commission_rate numeric(5,4) not null default 0.05,
  clicks int not null default 0,
  conversions int not null default 0,
  created_at timestamptz not null default now()
);
alter table partner_links enable row level security;
create index partner_links_partner_idx on partner_links(partner_id, created_at desc);
create policy plinks_sel on partner_links for select using (is_admin() or auth.uid() = partner_id);
create policy plinks_ins on partner_links for insert with check (auth.uid() = partner_id);
create policy plinks_upd on partner_links for update using (auth.uid() = partner_id) with check (auth.uid() = partner_id);
create policy plinks_del on partner_links for delete using (auth.uid() = partner_id);

create table link_clicks (
  id uuid primary key default gen_random_uuid(),
  link_id uuid not null references partner_links(id) on delete cascade,
  ip_hash text,
  referer text,
  user_agent text,
  clicked_at timestamptz not null default now()
);
alter table link_clicks enable row level security;
create index link_clicks_link_idx on link_clicks(link_id, clicked_at desc);
create policy clicks_sel on link_clicks for select using (
  is_admin() or exists (
    select 1 from partner_links l where l.id = link_clicks.link_id and l.partner_id = auth.uid()
  )
);

create table conversions (
  id uuid primary key default gen_random_uuid(),
  link_id uuid references partner_links(id) on delete set null,
  partner_id uuid not null references partners(id) on delete cascade,
  order_id uuid not null,
  order_type text not null check (order_type in ('general','retail','wholesale')),
  order_amount numeric(12,2) not null,
  commission_rate numeric(5,4) not null,
  commission_amount numeric(12,2) not null,
  status text not null default 'pending' check (status in ('pending','confirmed','canceled','settled')),
  created_at timestamptz not null default now(),
  unique (order_id, order_type)
);
alter table conversions enable row level security;
create index conversions_partner_idx on conversions(partner_id, created_at desc);
create policy conv_sel on conversions for select using (is_admin() or auth.uid() = partner_id);

create table settlements (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references partners(id) on delete cascade,
  period text not null,
  total_amount numeric(12,2) not null default 0,
  status text not null default 'pending' check (status in ('pending','paid')),
  bank_snapshot text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (partner_id, period)
);
alter table settlements enable row level security;
create index settlements_partner_idx on settlements(partner_id, period desc);
create policy settle_sel on settlements for select using (is_admin() or auth.uid() = partner_id);

commit;
