begin;

-- 상품당 중복 링크 정리 (하나만 유지)
delete from partner_links a using partner_links b
where a.partner_id = b.partner_id and a.product_id = b.product_id
  and a.product_id is not null and a.ctid < b.ctid;

-- 파트너-상품당 링크 1개 제약 (링크받기=1회, 이후 재발급으로 code만 변경)
create unique index if not exists partner_links_partner_product_uidx
  on partner_links(partner_id, product_id) where product_id is not null;

commit;
