-- Add the language field (used by the generation form) and an atomic
-- RPC that deducts a credit and records the generation in one transaction.
-- Using auth.uid() internally (rather than a client-supplied user id) so a
-- caller can never charge or record generations against another user.

alter table public.generations
  add column language text;

create function public.record_generation(
  p_input_text text,
  p_input_image_urls jsonb,
  p_doc_type text,
  p_style text,
  p_tone text,
  p_target_audience text,
  p_length text,
  p_language text,
  p_output_text text,
  p_tokens_used integer
)
returns table (generation_id uuid, remaining_credits integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_remaining integer;
  v_generation_id uuid;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  -- Atomic: the row lock this UPDATE takes serializes concurrent calls for
  -- the same user, so two simultaneous requests can never both succeed when
  -- only one credit remains.
  update public.profiles
  set credits = credits - 1
  where id = v_user_id and credits >= 1
  returning credits into v_remaining;

  if v_remaining is null then
    raise exception 'insufficient_credits';
  end if;

  insert into public.generations (
    user_id, input_text, input_image_urls, doc_type, style, tone,
    target_audience, length, language, output_text, tokens_used
  ) values (
    v_user_id, p_input_text, p_input_image_urls, p_doc_type, p_style, p_tone,
    p_target_audience, p_length, p_language, p_output_text, p_tokens_used
  )
  returning id into v_generation_id;

  insert into public.usage_logs (user_id, generation_id, action, tokens_used, credits_charged)
  values (v_user_id, v_generation_id, 'generation', p_tokens_used, 1);

  return query select v_generation_id, v_remaining;
end;
$$;

grant execute on function public.record_generation(
  text, jsonb, text, text, text, text, text, text, text, integer
) to authenticated;
