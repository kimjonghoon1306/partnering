-- 온파트너 정산 상세 금액 컬럼
-- 테리 실행 필요: 온종일팜 Supabase SQL Editor에서 실행

begin;

alter table settlements
  add column if not exists withholding_amount numeric(12,2) not null default 0,
  add column if not exists net_amount numeric(12,2) not null default 0,
  add column if not exists gross_amount numeric(12,2) not null default 0;

commit;
