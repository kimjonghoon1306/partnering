alter table campaign_products
  add column if not exists bonus_rate numeric(5,4) not null default 0;

do $$
begin
  alter table campaign_products
    add constraint campaign_products_bonus_rate_range
    check (bonus_rate >= 0 and bonus_rate <= 0.30) not valid;
exception
  when duplicate_object then null;
end $$;

alter table campaign_products
  validate constraint campaign_products_bonus_rate_range;
