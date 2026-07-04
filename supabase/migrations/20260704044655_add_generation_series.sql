-- Lets long-form content (e.g. a novel written chapter by chapter) be
-- grouped into a series so later parts can be generated with the previous
-- part as context, and so all parts can be downloaded individually or as
-- one combined document.

create table public.generation_series (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

create index generation_series_user_id_idx on public.generation_series (user_id);

alter table public.generation_series enable row level security;

create policy "Users can view own series" on public.generation_series for select
  using (user_id = auth.uid());

create policy "Users can insert own series" on public.generation_series for insert
  with check (user_id = auth.uid());

create policy "Users can update own series" on public.generation_series for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete own series" on public.generation_series for delete
  using (user_id = auth.uid());

alter table public.generations
  add column series_id uuid references public.generation_series (id) on delete set null,
  add column part_number integer;

create index generations_series_id_idx on public.generations (series_id);

-- Extend record_generation once more. Dropped and recreated (rather than a
-- bare CREATE OR REPLACE) because adding parameters changes the function's
-- signature.
drop function if exists public.record_generation(
  text, jsonb, text, text, text, text, text, text, text, integer, uuid, uuid
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
  p_part_number integer default null
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
    author_style_id, narrative_type_id, series_id, part_number
  ) values (
    v_user_id, p_input_text, p_input_image_urls, p_doc_type, p_style, p_tone,
    p_target_audience, p_length, p_language, p_output_text, p_tokens_used,
    p_author_style_id, p_narrative_type_id, p_series_id, p_part_number
  )
  returning id into v_generation_id;

  insert into public.usage_logs (user_id, generation_id, action, tokens_used, credits_charged)
  values (v_user_id, v_generation_id, 'generation', p_tokens_used, 1);

  return query select v_generation_id, v_remaining;
end;
$$;

grant execute on function public.record_generation(
  text, jsonb, text, text, text, text, text, text, text, integer, uuid, uuid, uuid, integer
) to authenticated;
