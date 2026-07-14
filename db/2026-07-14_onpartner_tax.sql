-- ══════════════════════════════════════════════
-- 온파트너 세금/원천징수 정보
-- 개인 파트너: 정산 시 3.3%(소득세 3% + 지방세 0.3%) 원천징수 후 지급
-- 사업자 파트너: 전액 지급, 세금계산서 발행 대상
-- 온종일팜 Supabase에서 실행
-- ══════════════════════════════════════════════
begin;

alter table partners add column if not exists tax_type text not null default 'individual'
  check (tax_type in ('individual','business'));
alter table partners add column if not exists resident_no text;    -- 개인: 주민등록번호(원천징수 신고용)
alter table partners add column if not exists business_no text;    -- 사업자: 사업자등록번호
alter table partners add column if not exists business_name text;  -- 사업자: 상호

-- 기존 RLS(본인 select/update, is_admin select) 그대로 적용됨.
-- 민감정보(resident_no)는 본인과 관리자(is_admin)만 조회 가능.

commit;
