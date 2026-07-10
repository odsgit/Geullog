-- 전개 방식(영웅의 여정 등 서사형 구조)으로 글을 생성하면 그 단계 본문 내용을 바탕으로
-- 제목을 하나 생성해 붙여준다. generations 테이블엔 지금까지 title 컬럼이 아예 없었다
-- (폼의 title 필드는 생성 전 참고용일 뿐 저장되지 않았음).
alter table public.generations
  add column title text;
