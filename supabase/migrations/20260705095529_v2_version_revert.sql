-- v2.0 리팩토링 STEP H: 히스토리에서 과거 버전으로 되돌리기(revert) 기능.
--
-- 되돌리기는 기존 버전을 절대 삭제/수정하지 않고, 선택된 버전의 내용을 복사해 새
-- generation_versions row를 추가하는 방식으로만 구현한다(append-only). generations에
-- current_version_id 포인터를 둬서 항상 어떤 버전이 "현재 활성 버전"인지 명확히 한다.

alter table public.generation_versions
  add column version_type text not null default 'generated'
    check (version_type in ('generated', 'reverted', 'tone_adjusted'));

alter table public.generations
  add column current_version_id uuid references public.generation_versions (id) on delete set null;

-- record_generation: 시그니처는 그대로, 최초 생성 시에도 generation_versions에 1번
-- 버전을 함께 남기고 current_version_id를 그 버전으로 세팅한다(이전에는 최초 생성물이
-- generations.output_text에만 저장되고 generation_versions에는 재생성/톤조정 때만
-- row가 생겼음 — 되돌리기 대상이 되려면 최초 생성물도 버전 row가 있어야 함).
create or replace function public.record_generation(
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
  p_development_structure text,
  p_author_style_id uuid default null,
  p_style_preset text default null,
  p_series_id uuid default null,
  p_part_number integer default null,
  p_image_mode text default null
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
  v_version_id uuid;
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
    development_structure, author_style_id, style_preset, series_id, part_number, image_mode
  ) values (
    v_user_id, p_input_text, p_input_image_urls, p_doc_type, p_style, p_tone,
    p_target_audience, p_length, p_language, p_output_text, p_tokens_used,
    p_development_structure, p_author_style_id, p_style_preset, p_series_id, p_part_number, p_image_mode
  )
  returning id into v_generation_id;

  insert into public.generation_versions (generation_id, output_text, version_number, version_type)
  values (v_generation_id, p_output_text, 1, 'generated')
  returning id into v_version_id;

  update public.generations set current_version_id = v_version_id where id = v_generation_id;

  insert into public.usage_logs (user_id, generation_id, action, tokens_used, credits_charged)
  values (v_user_id, v_generation_id, 'generation', p_tokens_used, 1);

  return query select v_generation_id, v_remaining;
end;
$$;

-- record_generation_version: p_version_type 파라미터 추가(재생성/톤조정을 구분해
-- 기록), 새 버전 삽입 후 current_version_id도 같은 트랜잭션에서 갱신.
drop function if exists public.record_generation_version(uuid, text, text);

create function public.record_generation_version(
  p_generation_id uuid,
  p_output_text text,
  p_action text default 'regeneration',
  p_version_type text default 'generated'
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

  insert into public.generation_versions (generation_id, output_text, version_number, version_type)
  values (p_generation_id, p_output_text, v_next_version, p_version_type)
  returning id into v_version_id;

  update public.generations set current_version_id = v_version_id where id = p_generation_id;

  insert into public.usage_logs (user_id, generation_id, action, tokens_used, credits_charged)
  values (v_user_id, p_generation_id, p_action, 0, 1);

  return query select v_version_id, v_remaining;
end;
$$;

grant execute on function public.record_generation_version(uuid, text, text, text) to authenticated;

-- revert_generation_version: 과거 버전의 내용을 복사해 새 row로 추가만 한다(기존 row는
-- 절대 update/delete하지 않음). 크레딧을 소모하지 않음 — 새로운 AI 생성이 아니라 과거
-- 내용을 다시 불러오는 것뿐이므로.
create function public.revert_generation_version(
  p_generation_id uuid,
  p_version_id uuid
)
returns table (version_id uuid, output_text text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_source_text text;
  v_next_version integer;
  v_new_version_id uuid;
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

  select gv.output_text into v_source_text
  from public.generation_versions gv
  where gv.id = p_version_id and gv.generation_id = p_generation_id;

  if v_source_text is null then
    raise exception 'version_not_found';
  end if;

  select coalesce(max(version_number), 0) + 1
  into v_next_version
  from public.generation_versions
  where generation_id = p_generation_id;

  insert into public.generation_versions (generation_id, output_text, version_number, version_type)
  values (p_generation_id, v_source_text, v_next_version, 'reverted')
  returning id into v_new_version_id;

  update public.generations set current_version_id = v_new_version_id where id = p_generation_id;

  return query select v_new_version_id, v_source_text;
end;
$$;

grant execute on function public.revert_generation_version(uuid, uuid) to authenticated;
