-- Credit top-up (데모): 실제 결제 연동 전까지, 정해진 패키지 금액만 즉시 충전 가능하게 하는
-- RPC. 클라이언트가 임의의 amount로 직접 호출해도 허용된 패키지 값이 아니면 거부되도록
-- 서버 사이드에서 화이트리스트 검증한다.
create or replace function public.charge_credits(p_amount integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_credits integer;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'reason', 'not_authenticated');
  end if;

  if p_amount not in (10, 30, 100, 300) then
    return jsonb_build_object('success', false, 'reason', 'invalid_amount');
  end if;

  update public.profiles
    set credits = credits + p_amount
    where id = v_user_id
    returning credits into v_credits;

  insert into public.usage_logs (user_id, action, credits_charged) values (v_user_id, 'credit_topup', -p_amount);

  return jsonb_build_object('success', true, 'credits', v_credits);
end;
$$;

grant execute on function public.charge_credits(integer) to authenticated;
