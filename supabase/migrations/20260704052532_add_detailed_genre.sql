-- Lets a user pick a more specific genre from the selected narrative type's
-- example_genres list (e.g. "여행 에세이" under 서사), in addition to the
-- practical doc_type field. Stored directly as text since it's derived from
-- narrative_types.example_genres client-side, not a separate reference table.

alter table public.generations
  add column detailed_genre text;

-- Extend record_generation once more. Dropped and recreated (rather than a
-- bare CREATE OR REPLACE) because adding a parameter changes the function's
-- signature.
drop function if exists public.record_generation(
  text, jsonb, text, text, text, text, text, text, text, integer, uuid, uuid, uuid, integer
);

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
  p_tokens_used integer,
  p_author_style_id uuid default null,
  p_narrative_type_id uuid default null,
  p_series_id uuid default null,
  p_part_number integer default null,
  p_detailed_genre text default null
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

  update public.profiles
  set credits = credits - 1
  where id = v_user_id and credits >= 1
  returning credits into v_remaining;

  if v_remaining is null then
    raise exception 'insufficient_credits';
  end if;

  insert into public.generations (
    user_id, input_text, input_image_urls, doc_type, style, tone,
    target_audience, length, language, output_text, tokens_used,
    author_style_id, narrative_type_id, series_id, part_number, detailed_genre
  ) values (
    v_user_id, p_input_text, p_input_image_urls, p_doc_type, p_style, p_tone,
    p_target_audience, p_length, p_language, p_output_text, p_tokens_used,
    p_author_style_id, p_narrative_type_id, p_series_id, p_part_number, p_detailed_genre
  )
  returning id into v_generation_id;

  insert into public.usage_logs (user_id, generation_id, action, tokens_used, credits_charged)
  values (v_user_id, v_generation_id, 'generation', p_tokens_used, 1);

  return query select v_generation_id, v_remaining;
end;
$$;

grant execute on function public.record_generation(
  text, jsonb, text, text, text, text, text, text, text, integer, uuid, uuid, uuid, integer, text
) to authenticated;
