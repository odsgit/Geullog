-- 폼 간소화: 프로덕션에서 필수 입력이 너무 많다는 피드백 반영. 실제 필수는
-- 주제/글종류/타겟독자 3개뿐이고 나머지(스타일/톤/분량/언어/전개방식/작가스타일/
-- 문체프리셋)는 전부 선택(고급 설정)으로 내린다. 대신 사용자 의도를 가장 잘 반영하는
-- "AI에게 추가 요청" 자유 입력과 SEO 키워드, 출력 형식(마크다운/일반 텍스트) 필드를 신규 추가.
--
-- 참고 URL(참고 자료) 필드는 이번에 추가하지 않음 — 서버에서 사용자가 준 임의 URL을
-- fetch하는 기능은 SSRF(내부망 스캔 등) 위험이 있어 별도로 도메인 화이트리스트/타임아웃/
-- 응답 크기 제한을 갖춘 전용 구현이 필요함. 지금은 스코프 밖으로 둠.

alter table public.generations
  add column additional_instruction text,
  add column seo_keywords text[],
  add column output_format text check (output_format in ('markdown', 'plain'));

-- record_generation 재정의: 시그니처를 "필수 파라미터 먼저 → 옵션 파라미터(default null)"
-- 순서로 재정렬(PL/pgSQL은 default 파라미터 뒤에 non-default 파라미터를 허용하지 않음).
-- Supabase는 이름 기반(named) 인자로 RPC를 호출하므로 선언 순서를 바꿔도 클라이언트
-- 호출 코드에는 영향 없음. style/tone/length/language/development_structure를 전부
-- default null로 바꿔 선택 사항으로 만들고, additional_instruction/seo_keywords/
-- output_format 파라미터를 추가한다.
drop function if exists public.record_generation(
  text, jsonb, text, text, text, text, text, text, text, integer, text, uuid, text, uuid, integer, text
);

create function public.record_generation(
  p_input_text text,
  p_input_image_urls jsonb,
  p_doc_type text,
  p_target_audience text,
  p_output_text text,
  p_tokens_used integer,
  p_style text default null,
  p_tone text default null,
  p_length text default null,
  p_language text default null,
  p_development_structure text default null,
  p_author_style_id uuid default null,
  p_style_preset text default null,
  p_series_id uuid default null,
  p_part_number integer default null,
  p_image_mode text default null,
  p_additional_instruction text default null,
  p_seo_keywords text[] default null,
  p_output_format text default null
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
    development_structure, author_style_id, style_preset, series_id, part_number, image_mode,
    additional_instruction, seo_keywords, output_format
  ) values (
    v_user_id, p_input_text, p_input_image_urls, p_doc_type, p_style, p_tone,
    p_target_audience, p_length, coalesce(p_language, 'ko'), p_output_text, p_tokens_used,
    p_development_structure, p_author_style_id, p_style_preset, p_series_id, p_part_number, p_image_mode,
    p_additional_instruction, p_seo_keywords, coalesce(p_output_format, 'markdown')
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

grant execute on function public.record_generation(
  text, jsonb, text, text, text, integer, text, text, text, text, text, uuid, text, uuid, integer, text, text, text[], text
) to authenticated;
