begin;

-- conversions.order_id 를 uuid → text 로 변경
-- (온종일팜 주문번호가 uuid가 아닌 문자열 형식일 수 있어 유연하게 수용)
alter table conversions alter column order_id type text using order_id::text;

commit;
