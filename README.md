# Geullog

Geullog (글로그)는 사진 한 장, 키워드 하나로 완성되는 나만의 글쓰기 도구로, 주제, 키워드, 참고할 글의 일부, 혹은 사진을 입력하면 AI가 원하는 스타일과 형식에 맞춰 글을 완성해주는 콘텐츠 제작 플랫폼입니다.

React + TypeScript(Vite) 기반 프로젝트. Cloudflare Pages 배포를 전제로 구성되어 있습니다.

## 폴더 구조

```
src/
  components/   재사용 UI 컴포넌트
  pages/        라우트 단위 페이지
  lib/          외부 서비스 클라이언트 (supabase.ts, openai.ts)
  hooks/        커스텀 훅
  types/        공용 타입 및 환경변수 타입 선언
functions/      Cloudflare Pages Functions (서버리스 API 라우트)
```

## 로컬 실행 방법

1. 의존성 설치

   ```bash
   npm install
   ```

2. 환경변수 파일 생성

   ```bash
   cp .env.example .env
   ```

   `.env` 파일을 열어 실제 값을 채워주세요.
   - `OPENAI_API_KEY`: Cloudflare Pages Functions(`functions/`)에서만 사용되는 서버 전용 키입니다. 브라우저 번들에 절대 노출되지 않습니다.
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GA_MEASUREMENT_ID`, `CLARITY_PROJECT_ID`: 클라이언트 코드에서 `import.meta.env`로 접근합니다 (`vite.config.ts`의 `envPrefix` 설정 참고).

3. 개발 서버 실행

   ```bash
   npm run dev
   ```

   기본적으로 http://localhost:5173 에서 확인할 수 있습니다.

4. 그 외 스크립트

   ```bash
   npm run build         # 프로덕션 빌드 (dist/)
   npm run preview       # 빌드 결과 미리보기
   npm run lint          # ESLint 검사
   npm run lint:fix      # ESLint 자동 수정
   npm run format        # Prettier 포맷팅
   npm run format:check  # Prettier 검사만 수행
   npm run pages:dev     # Cloudflare Pages Functions 포함 로컬 미리보기
   npm run gen:types     # Supabase 스키마로부터 src/types/supabase.ts 재생성
   ```

## Supabase

`supabase/migrations/`에 SQL 마이그레이션을 관리합니다. 테이블: `profiles`, `generations`,
`generation_versions`, `templates`, `usage_logs`. 모든 테이블은 RLS가 활성화되어 있고 본인 소유
데이터만 접근 가능합니다 (`usage_logs`는 조회/생성만 가능한 append-only 로그).

```bash
supabase login                                    # 최초 1회
supabase link --project-ref xdbmuarvrnuwksgczsbf  # 최초 1회, Geullog 프로젝트 연결
supabase migration new <설명>                      # 새 마이그레이션 파일 생성
supabase db push                                  # 마이그레이션을 원격 DB에 적용
npm run gen:types                                 # 적용된 스키마 기준으로 타입 재생성
```

스키마를 변경했다면 `supabase db push` 이후 `npm run gen:types`를 실행해 `src/lib/supabase.ts`가
사용하는 타입을 최신 상태로 유지하세요.

### Supabase Edge Functions (주간 이메일 요약)

`supabase/functions/weekly-summary/`가 매주 월요일 00:00 UTC(09:00 KST)에 pg_cron으로 실행되어
사용자별 "이번 주 생성한 글 N개, 남은 크레딧 M개" 요약 이메일을 [Resend](https://resend.com)로 발송합니다.

```bash
supabase functions deploy weekly-summary --project-ref xdbmuarvrnuwksgczsbf
supabase secrets set RESEND_API_KEY=<Resend에서 발급받은 키> --project-ref xdbmuarvrnuwksgczsbf
```

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`는 Supabase가 모든 Edge Function에 자동으로 주입하므로
  별도 등록이 필요 없습니다.
- `RESEND_API_KEY`가 등록되지 않은 상태에서도 함수는 정상 실행되며, 각 사용자에 대해 발송을
  건너뛰었다는 결과만 반환합니다(에러 아님) — Resend 계정을 만들고 키를 발급받은 뒤 등록하면
  실제 발송이 시작됩니다. 무료 플랜에서는 발신 도메인을 검증하기 전까지 본인 계정 이메일로만
  테스트 발송이 가능합니다.
- 이 함수는 `CRON_SECRET`(마이그레이션에서 Vault로 무작위 생성, 평문 값은 git에 없음)이 요청 헤더
  `x-cron-secret`에 일치해야만 동작합니다. pg_cron 작업이 이 값을 자동으로 실어 보내므로 별도 설정은
  필요 없지만, 로컬에서 수동 호출로 디버깅하려면 Supabase 대시보드에서 Vault 값을 직접 확인하세요.

## Cloudflare Pages 배포

GitHub 저장소를 Cloudflare Pages 대시보드에 직접 연동하는 방식(Git integration)을 사용합니다.
별도 GitHub Actions 배포 워크플로우 없이 Cloudflare가 push/PR을 감지해 자동으로 빌드·배포합니다.

### 최초 연동 (1회만)

1. [Cloudflare 대시보드](https://dash.cloudflare.com/) → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. `odsgit/Geullog` 저장소 선택 (처음 연동 시 GitHub에 Cloudflare Pages 앱 설치 권한 승인 필요)
3. 빌드 설정
   - Production branch: `main`
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: `/`
4. **Settings → Functions → Compatibility flags**에 `nodejs_compat`을 Production/Preview 양쪽에 추가
   (저장소의 `wrangler.toml`에도 명시되어 있지만, 대시보드 Git 배포는 이 값을 별도로 반영해야 합니다)
5. **Settings → Environment variables**에 `.env.example` 목록을 Production/Preview 각각 등록
   - `OPENAI_API_KEY` (Secret, `functions/`에서만 사용 — 클라이언트에 노출되지 않음)
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `GA_MEASUREMENT_ID`, `CLARITY_PROJECT_ID`
   - Preview 환경에는 개발/스테이징용 Supabase 프로젝트 값을 쓰는 것을 권장합니다.
6. Save and Deploy

### 이후 동작

- `main` 브랜치에 push되면 자동으로 프로덕션 배포됩니다.
- PR을 생성하면 자동으로 Preview 배포가 생성되고, Cloudflare Pages 봇이 PR에 미리보기 URL을 코멘트로 남깁니다.
- `functions/` 디렉터리는 별도 설정 없이 Pages Functions로 자동 인식됩니다.

### 로컬에서 Functions 포함 미리보기

```bash
npm run pages:dev
```
