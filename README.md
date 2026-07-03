# Geullog

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
   ```

## Cloudflare Pages 배포

- Build command: `npm run build`
- Build output directory: `dist`
- Functions: 저장소 루트의 `functions/` 디렉터리가 자동으로 Pages Functions로 인식됩니다.
- Cloudflare Pages 프로젝트 설정의 환경변수에 `.env.example`과 동일한 키를 등록하세요.
