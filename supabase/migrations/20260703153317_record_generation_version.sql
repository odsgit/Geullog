-- Atomic RPC for regeneration / tone adjustment: verifies the generation
-- belongs to the caller, deducts one credit, and inserts the new version
-- + usage log in a single transaction (same safety pattern as
-- record_generation: derives the user from auth.uid(), single UPDATE with
-- a credits >= 1 guard so concurrent calls can't double-charge).

create function public.record_generation_version(
  p_generation_id uuid,
  p_output_text text,
  p_action text default 'regeneration'
)
returns table (version_id uuid, remaining_credits integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_remaining integer;
  v_version_id uuid;
  v_next_version integer;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (
    select 1 from public.generations
    where id = p_generation_id and user_id = v_user_id
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

  select coalesce(max(version_number), 0) + 1
  into v_next_version
  from public.generation_versions
  where generation_id = p_generation_id;

  insert into public.generation_versions (generation_id, output_text, version_number)
  values (p_generation_id, p_output_text, v_next_version)
  returning id into v_version_id;

  insert into public.usage_logs (user_id, generation_id, action, tokens_used, credits_charged)
  values (v_user_id, p_generation_id, p_action, 0, 1);

  return query select v_version_id, v_remaining;
end;
$$;

grant execute on function public.record_generation_version(uuid, text, text) to authenticated;
