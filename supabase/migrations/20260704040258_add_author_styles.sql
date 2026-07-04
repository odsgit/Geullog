-- A curated database of famous authors' writing styles that users can pick
-- from when generating text. Read-only reference data: RLS allows anyone to
-- select, but there are no insert/update/delete policies for client roles —
-- rows are only ever seeded/edited via migrations.

create table public.author_styles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  style_description text not null,
  representative_works text,
  created_at timestamptz not null default now()
);

alter table public.author_styles enable row level security;

create policy "Anyone can view author styles" on public.author_styles for select
  using (true);

insert into public.author_styles (name, style_description, representative_works) values
  ('어니스트 헤밍웨이', '군더더기 없는 짧고 간결한 문장으로, 수식어를 최소화하고 사실과 행동 위주로 담담하게 서술하는 하드보일드 스타일로 작성하세요.', '노인과 바다, 무기여 잘 있거라'),
  ('무라카미 하루키', '일상적인 소재에서 출발해 몽환적이고 초현실적인 분위기를 자아내며, 담담하고 관조적인 어조로 서술하세요.', '상실의 시대(노르웨이의 숲), 1Q84'),
  ('김영하', '간결하고 냉소적이면서도 세련된 문장으로, 현대적이고 감각적인 어휘를 사용해 작성하세요.', '살인자의 기억법, 나는 나를 파괴할 권리가 있다'),
  ('한강', '시적이고 절제된 문장으로, 고통과 치유의 정서를 섬세하고 서정적으로 그려내며 작성하세요.', '채식주의자, 소년이 온다'),
  ('오스카 와일드', '위트와 아이러니가 넘치는 문장으로, 격언처럼 촌철살인하는 표현을 곳곳에 사용해 작성하세요.', '도리언 그레이의 초상'),
  ('제인 오스틴', '우아하고 정제된 문장으로, 인물과 사회를 은근한 풍자와 유머로 관찰하듯 작성하세요.', '오만과 편견, 이성과 감성'),
  ('스티븐 킹', '생생하고 구체적인 묘사로 긴장감을 조성하며, 몰입감 있게 이야기를 전개하듯 작성하세요.', '샤이닝, 미저리'),
  ('박완서', '섬세한 심리 묘사와 담담한 어조로, 삶의 애환을 따뜻하면서도 날카롭게 담아내며 작성하세요.', '엄마의 말뚝, 그 많던 싱아는 누가 다 먹었을까');

-- Track which author style (if any) a generation was created with, so
-- regenerate can reuse the same choice.
alter table public.generations
  add column author_style_id uuid references public.author_styles (id) on delete set null;

-- Extend record_generation with an optional author style. Dropped and
-- recreated (rather than a bare CREATE OR REPLACE) because adding a
-- parameter changes the function's signature, which would otherwise leave
-- the old 10-argument overload in place alongside the new one.
drop function if exists public.record_generation(
  text, jsonb, text, text, text, text, text, text, text, integer
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
  p_author_style_id uuid default null
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
    target_audience, length, language, output_text, tokens_used, author_style_id
  ) values (
    v_user_id, p_input_text, p_input_image_urls, p_doc_type, p_style, p_tone,
    p_target_audience, p_length, p_language, p_output_text, p_tokens_used, p_author_style_id
  )
  returning id into v_generation_id;

  insert into public.usage_logs (user_id, generation_id, action, tokens_used, credits_charged)
  values (v_user_id, v_generation_id, 'generation', p_tokens_used, 1);

  return query select v_generation_id, v_remaining;
end;
$$;

grant execute on function public.record_generation(
  text, jsonb, text, text, text, text, text, text, text, integer, uuid
) to authenticated;
