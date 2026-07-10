-- 사용자가 자신의 OpenAI API 키를 입력해야만 생성 기능을 쓸 수 있도록 한다.
-- 관리자 계정(odsbig@gmail.com)만 서버 공용 키로 예외 처리되며, 그 판별은
-- auth.users.email을 백엔드에서 직접 비교하는 방식이라 별도 컬럼이 필요 없다.
alter table public.profiles
  add column openai_api_key text;
