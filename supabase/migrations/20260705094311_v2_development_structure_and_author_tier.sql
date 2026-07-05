-- v2.0 리팩토링 STEP A: 필드 중복 정리 + 전개방식 필드 추가 + 작가 스타일 티어링.
--
-- 1) '서술 유형(narrative_type)'을 완전히 제거한다 — '설명'/'서사'가 스타일 옵션의
--    '정보전달형'/'스토리텔링형'과 개념이 중복되어 있었음. 대신 단일 'development_structure'
--    (전개 방식) 필드로 통합한다.
-- 2) styleOptions에서 '정보전달형'/'스토리텔링형' 제거(narrative_type과 중복).
-- 3) doc_type이 실용형(practical)일 때 author_style 대신 쓰는 '문체 프리셋(style_preset)' 필드 추가.
-- 4) author_styles에 재현 신뢰도 tier(tier1/tier2)와 tier2 작가를 위한 구체적 traits 추가.
--
-- 기존 generations row는 development_structure가 없으므로 nullable로 추가하고 백필하지
-- 않는다 — 이후 생성분부터 애플리케이션(zod) 레벨에서 필수로 검증한다(DB에는 NOT NULL을
-- 걸지 않음, 걸면 기존 row 때문에 마이그레이션이 실패함).

alter table public.generations
  add column development_structure text,
  add column style_preset text,
  add column image_mode text check (image_mode in ('ocr', 'describe'));

-- 서술 유형(narrative_type) 완전 제거: FK 컬럼 → 테이블 순으로 drop.
alter table public.generations
  drop column narrative_type_id,
  drop column detailed_genre;

drop table public.narrative_types;

-- author_styles 티어링: 기본은 tier1(모델이 이미 잘 아는 유명 작가), 데이터가 희소해
-- 문체 재현이 불안정한 작가만 tier2로 표시하고 traits(구체적 문체 특징 3~5개)를 채운다.
alter table public.author_styles
  add column tier text not null default 'tier1' check (tier in ('tier1', 'tier2')),
  add column traits text[];

update public.author_styles set tier = 'tier2', traits = array[
  '한 문장이 페이지 단위로 이어지는 극단적으로 긴 만연체, 마침표를 거의 쓰지 않음',
  '쉼표와 접속사로 문장을 계속 확장하며 숨 막히는 듯한 압박감을 조성',
  '종말론적이고 음울한 분위기',
  '같은 이미지나 문구를 변주하며 반복하는 최면적 리듬'
] where name = '라스로 크라스나호르카이';

update public.author_styles set tier = 'tier2', traits = array[
  '일제강점기 세태를 겨냥한 반어법과 냉소',
  '표면적으로는 긍정하는 척하면서 실제로는 비판하는 반어적 서술자 시점',
  '판소리 사설체 특유의 구어적 리듬과 만담조 문체',
  '풍자 대상 인물의 어리석음을 그 인물 시점에서 그대로 서술해 아이러니를 극대화'
] where name = '채만식';

update public.author_styles set tier = 'tier2', traits = array[
  '전라도 방언과 토속어를 정교하게 구사',
  '관혼상제·세시풍속 등 전통 생활문화를 백과사전적으로 서술',
  '유장하고 리듬감 있는 만연체 문장',
  '색채어와 감각적 묘사가 극도로 풍부'
] where name = '최명희';

update public.author_styles set tier = 'tier2', traits = array[
  '구어체에 가까운 생생하고 위트 있는 문장',
  '가정과 공동체 내부의 긴장을 건조하고 다정한 유머로 그려냄',
  '부엌, 신발, 기도 매트 같은 구체적 사물을 통해 억압과 저항을 형상화',
  '조용함과 코믹함을 오가면서도 일관된 시선을 유지'
] where name = '바누 무쉬타크';

update public.author_styles set tier = 'tier2', traits = array[
  '실재하지 않는 과거 문헌을 발굴한 것처럼 위장하는 메타픽션적 설정(가짜 여행기+가짜 번역 주석)',
  '각 장을 하나의 음식으로 구성해 감각적 디테일로 시대상을 환기',
  '여러 겹의 번역자·주석자 시점을 겹쳐 신뢰할 수 없는 화자 구조를 만듦',
  '역사적 사실 조사에 기반한 정교한 시대 고증과 서사를 결합'
] where name = '양솽쯔';

-- record_generation 재정의: narrative_type_id/detailed_genre 파라미터 제거,
-- development_structure(필수)/style_preset/image_mode 파라미터 추가.
-- 시그니처가 바뀌므로 기존 15-인자 오버로드를 drop하고 새로 만든다.
drop function if exists public.record_generation(
  text, jsonb, text, text, text, text, text, text, text, integer, uuid, uuid, uuid, integer, text
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

  insert into public.usage_logs (user_id, generation_id, action, tokens_used, credits_charged)
  values (v_user_id, v_generation_id, 'generation', p_tokens_used, 1);

  return query select v_generation_id, v_remaining;
end;
$$;

grant execute on function public.record_generation(
  text, jsonb, text, text, text, text, text, text, text, integer, text, uuid, text, uuid, integer, text
) to authenticated;
