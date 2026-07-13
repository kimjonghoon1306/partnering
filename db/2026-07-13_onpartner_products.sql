begin;

-- 상품별 수수료율(마진률) — 관리자가 설정. 온종일팜 products 는 건드리지 않음.
create table if not exists product_commissions (
  product_id uuid primary key,
  commission_rate numeric(5,4) not null default 0.05,
  updated_by uuid,
  updated_at timestamptz not null default now()
);
alter table product_commissions enable row level security;
drop policy if exists pc_sel on product_commissions;
create policy pc_sel on product_commissions for select using (true);           -- 파트너도 마진 확인 가능
drop policy if exists pc_ins on product_commissions;
create policy pc_ins on product_commissions for insert with check (is_admin()); -- 설정은 관리자만
drop policy if exists pc_upd on product_commissions;
create policy pc_upd on product_commissions for update using (is_admin()) with check (is_admin());
drop policy if exists pc_del on product_commissions;
create policy pc_del on product_commissions for delete using (is_admin());

-- partner_links 에 상품 정보(스냅샷) 컬럼 추가 — "링크 받기"로 만든 링크가 어떤 상품인지
alter table partner_links add column if not exists product_id uuid;
alter table partner_links add column if not exists product_name text;
alter table partner_links add column if not exists product_image text;
alter table partner_links add column if not exists product_price numeric(12,2);

commit;
