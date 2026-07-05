-- "이어서 쓰기 그만하기" 기능: 시리즈(또는 단일 이어쓰기 글)를 마무리하며 AI로 전체 제목과
-- 문단별 소제목을 붙여 다운로드하는 액션 1회당 크레딧 1개를 원자적으로 차감한다. 실제 제목/
-- 소제목 생성은 functions/api/finalize-series.ts에서 OpenAI를 호출해 처리하고, 결과를 DB에
-- 저장하지는 않는(다운로드 전용 export) 일회성 액션이라 이 RPC는 크레딧 차감과 사용 기록만
-- 담당한다(record_generation과 동일한 원자적 패턴).
create function public.charge_series_finalize(
  p_generation_id uuid,
  p_tokens_used integer default 0
)
returns table (remaining_credits integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_remaining integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (
    select 1 from public.generations where id = p_generation_id and user_id = v_user_id
  ) then
    raise exception 'not_found';
  end if;

  update public.profiles
  set credits = credits - 1
  where id = v_user_id and credits >= 1
  returning credits into v_remaining;

  if v_remaining is null then
    raise exception 'insufficient_credits';
  end if;

  insert into public.usage_logs (user_id, generation_id, action, tokens_used, credits_charged)
  values (v_user_id, p_generation_id, 'series_finalize', p_tokens_used, 1);

  return query select v_remaining;
end;
$$;

grant execute on function public.charge_series_finalize(uuid, integer) to authenticated;
