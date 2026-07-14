create table if not exists partner_ads (
  id uuid primary key default gen_random_uuid(),
  tag text,
  title text,
  subtitle text,
  cta_label text,
  image_url text not null,
  product_id uuid,
  link_url text,
  sort_order int default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table partner_ads enable row level security;

drop policy if exists partner_ads_select on partner_ads;
create policy partner_ads_select
  on partner_ads
  for select
  using (true);

drop policy if exists partner_ads_insert on partner_ads;
create policy partner_ads_insert
  on partner_ads
  for insert
  with check (is_admin());

drop policy if exists partner_ads_update on partner_ads;
create policy partner_ads_update
  on partner_ads
  for update
  using (is_admin())
  with check (is_admin());

drop policy if exists partner_ads_delete on partner_ads;
create policy partner_ads_delete
  on partner_ads
  for delete
  using (is_admin());

create index if not exists partner_ads_active_sort_idx
  on partner_ads(is_active, sort_order);
