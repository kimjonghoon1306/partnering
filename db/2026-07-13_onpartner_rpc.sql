begin;

-- 클릭/전환 카운터 원자적 증가 (서버함수에서 호출, security definer로 RLS 우회)
create or replace function op_increment_click(p_link uuid)
returns void language sql security definer as $$
  update partner_links set clicks = clicks + 1 where id = p_link;
$$;

create or replace function op_increment_conversion(p_link uuid)
returns void language sql security definer as $$
  update partner_links set conversions = conversions + 1 where id = p_link;
$$;

commit;
