begin;

-- 파트너가 anon/authenticated API로 partner_links의 보안 민감 컬럼을 조작하지 못하게 방어한다.
-- RLS는 "행" 접근만 제한하므로, 수수료율/목적지/카운터 같은 컬럼 무결성은 트리거로 강제한다.
create or replace function op_harden_partner_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rate numeric(5,4);
  v_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
begin
  if tg_op = 'UPDATE' and v_role <> 'service_role' and not is_admin() then
    new.partner_id = old.partner_id;
    new.product_id = old.product_id;
    new.product_url = old.product_url;
    new.product_name = old.product_name;
    new.product_image = old.product_image;
    new.product_price = old.product_price;
    new.commission_rate = old.commission_rate;
    new.clicks = old.clicks;
    new.conversions = old.conversions;
    new.created_at = old.created_at;
  end if;

  if new.product_id is not null then
    select pc.commission_rate into v_rate
    from product_commissions pc
    where pc.product_id = new.product_id;

    new.product_url = 'https://app.yuanfnb.com/shop/product/' || new.product_id::text;
    new.commission_rate = coalesce(v_rate, 0.05);
  else
    if new.product_url is null
       or new.product_url !~ '^https://app\.yuanfnb\.com(/|$)' then
      raise exception 'invalid partner link destination';
    end if;
    new.commission_rate = 0.05;
  end if;

  if new.code is null or new.code !~ '^[A-Za-z0-9-]{4,64}$' then
    raise exception 'invalid partner link code';
  end if;

  new.clicks = greatest(coalesce(new.clicks, 0), 0);
  new.conversions = greatest(coalesce(new.conversions, 0), 0);
  return new;
end;
$$;

drop trigger if exists trg_op_harden_partner_link on partner_links;
create trigger trg_op_harden_partner_link
before insert or update on partner_links
for each row execute function op_harden_partner_link();

-- 파트너가 자신의 status를 직접 active로 되돌려 정지를 우회하지 못하게 한다.
-- 관리자 또는 service_role만 status 변경 가능, 일반 파트너의 다른 프로필 수정은 유지한다.
create or replace function op_harden_partner_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
begin
  if tg_op = 'UPDATE'
     and v_role <> 'service_role'
     and not is_admin()
     and new.status is distinct from old.status then
    new.status = old.status;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_op_harden_partner_status on partners;
create trigger trg_op_harden_partner_status
before update on partners
for each row execute function op_harden_partner_status();

commit;
