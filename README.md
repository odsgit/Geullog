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
   ```

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

<!-- Cloudflare Pages preview deployment verification -->
