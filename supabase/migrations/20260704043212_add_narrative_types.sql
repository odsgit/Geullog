-- A curated database of the four rhetorical/narrative modes (서사/묘사/설명/논증)
-- used in Korean composition pedagogy, imported from writing_styles_db.xlsx.
-- Users can optionally pick one when generating text — orthogonal to doc_type
-- (a blog post can be narrative, descriptive, expository, or argumentative).
-- Read-only reference data, same pattern as author_styles: RLS allows anyone
-- to select, no write policies for client roles.

create table public.narrative_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  definition text not null,
  core_elements text,
  example_genres text,
  created_at timestamptz not null default now()
);

alter table public.narrative_types enable row level security;

create policy "Anyone can view narrative types" on public.narrative_types for select
  using (true);

insert into public.narrative_types (name, definition, core_elements, example_genres) values
  ('서사 (Narration)', '시간의 흐름과 경과에 따라 사건, 행동, 상황의 유기적인 변화와 전개 과정을 일관성 있게 기술하는 방식', '시간의 추이에 따른 사건의 진행, 인물의 행동 변화, 서사적 인과관계, 플롯(구성)', '• 소설 (단편소설, 장편소설, 역사소설, 추리소설, SF소설, 판타지소설, 웹소설)
• 드라마 및 영화 시나리오, 연극 희곡, 웹툰 콘티 및 시나리오
• 역사서, 사학 기록물, 연표 기반 해설서
• 전기문 (위인전, 평전, 자서전, 회고록, 행장)
• 일기 (그림일기, 교환일기, 감사일기, 육아일기, 투병기)
• 기행문, 여행 에세이, 탐방기
• 사건 보고서, 사고 경위서, 수사 기록, 법정 서사 기록
• 뉴스 리포트 (사건 사고 보도), 다큐멘터리 스크립트'),
  ('묘사 (Description)', '사람, 사물, 자연 풍경, 내부 배경 등을 관찰하여 마치 눈앞에 시각적으로 그려지듯 감각적 언어로 표현하는 방식', '감각적 세부 사항 (시각, 청각, 촉각, 후각, 미각), 공간적 배치, 지각적 인상, 비유와 상징', '• 시 (서정시, 서사시, 정형시, 자유시, 현대시)
• 소설 내 배경 묘사 및 인물 외양/심리 묘사 대목
• 기행문의 풍경 및 토속 음식 서술 단락
• 감성 에세이, 관찰 수필
• 제품 리뷰, 음식 평론, 미식기, 공간 가이드 리뷰
• 미술품/건축물 도록 및 해설서, 전시회 큐레이팅 스크립트
• 부동산 매물 소개서, 인테리어 컨셉 설명서
• 메이크업 및 패션 스타일링 컨셉 가이드북'),
  ('설명 (Exposition)', '어떤 지식, 개념, 이론, 사실적 정보를 독자가 쉽게 이해할 수 있도록 객관적이고 명확하게 풀어내는 방식', '객관적 사실(Fact), 통계 데이터, 정의(Definition), 예시, 비교와 대조, 분류와 분석', '• 교과서, 아동 학습서, 참고서, 대학 교재
• 백과사전 항목, 위키백과(Wikipedia) 문서, 지식백과
• 제품 사용 설명서(매뉴얼), 가전제품 작동 가이드, 소프트웨어 API 문서
• 비즈니스 보고서, 기업 분석 리포트, 정부 정책 동향 보고서, 조사 결과 보고서
• 일반 뉴스 기사, 스트레이트 보도, 정보성 카드뉴스 문구
• 학술 논문(연구 방법 및 결과 설명 단락), 기술 백서
• 박물관·과학관 전시 안내문, 관광지 리플릿, 시설 이용 안내문
• 정보성 블로그 포스팅, FAQ(자주 묻는 질문) 답변서'),
  ('논증 (Argumentation)', '논리적 추론(연역, 귀납 등)과 타당한 근거를 바탕으로 자신의 주장이 정당함을 입증하여 독자를 설득하는 방식', '명확한 명제(주장), 객관적/논리적 논거, 추론 과정의 타당성, 예상 반론 및 재반박', '• 논설문, 신문 사설, 칼럼, 시론
• 학술 논문 (서론 및 결론, 고찰 단락), 연구 제안서
• 대선 연설문, 정책 소견서, 호소문, 선언서
• 법정 변론서, 검사 구형문, 판결문, 소장, 변호인 의견서
• 기업 기획서, 사업 제안서, 투자 유치 피치덱 서술문
• 서평, 영화 평론, 문화 예술 비평문
• 토론 입론서, 토론 반박문
• 소비자 건의문, 대정부 탄원서');

-- Track which narrative type (if any) a generation was created with, so
-- regenerate can reuse the same choice (same pattern as author_style_id).
alter table public.generations
  add column narrative_type_id uuid references public.narrative_types (id) on delete set null;

-- Extend record_generation again. Dropped and recreated (rather than a bare
-- CREATE OR REPLACE) because adding a parameter changes the function's
-- signature.
drop function if exists public.record_generation(
  text, jsonb, text, text, text, text, text, text, text, integer, uuid
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
  p_narrative_type_id uuid default null
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
    author_style_id, narrative_type_id
  ) values (
    v_user_id, p_input_text, p_input_image_urls, p_doc_type, p_style, p_tone,
    p_target_audience, p_length, p_language, p_output_text, p_tokens_used,
    p_author_style_id, p_narrative_type_id
  )
  returning id into v_generation_id;

  insert into public.usage_logs (user_id, generation_id, action, tokens_used, credits_charged)
  values (v_user_id, v_generation_id, 'generation', p_tokens_used, 1);

  return query select v_generation_id, v_remaining;
end;
$$;

grant execute on function public.record_generation(
  text, jsonb, text, text, text, text, text, text, text, integer, uuid, uuid
) to authenticated;
