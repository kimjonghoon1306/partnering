create table if not exists campaign_products (
  campaign_id uuid not null references campaigns(id) on delete cascade,
  product_id uuid not null,
  primary key (campaign_id, product_id)
);

alter table campaign_products enable row level security;

drop policy if exists campaign_products_sel on campaign_products;
create policy campaign_products_sel
  on campaign_products
  for select
  using (true);

drop policy if exists campaign_products_admin on campaign_products;
create policy campaign_products_admin
  on campaign_products
  for all
  using (is_admin())
  with check (is_admin());

create index if not exists campaign_products_product_id_idx
  on campaign_products(product_id);

create index if not exists campaign_products_campaign_id_idx
  on campaign_products(campaign_id);
