# Geullog 개발 기획 & 단계별 지시문

> **서비스명:** Geullog
> **개발 환경:** Antigravity IDE (Agent: Claude)
> **스택:** React + TypeScript / Supabase / Cloudflare Pages / GitHub / OpenAI API / Microsoft Clarity / Google Analytics

---

## 0. 지시문 작성 원칙

Antigravity에서 Claude 에이전트에게 작업을 시킬 때는 아래 형식을 지키면 결과물 품질이 좋아집니다.

```
[목표] 한 문장으로 이번 작업의 결과물
[컨텍스트] 관련 파일/폴더 경로, 기존 스키마, 사용 중인 라이브러리 버전
[제약조건] 하지 말아야 할 것 (예: API 키 클라이언트 노출 금지)
[완료 기준] 어떻게 테스트하면 되는지
```

**진행 팁**
- 같은 세션(컨텍스트) 안에서 단계를 이어가면 에이전트가 폴더 구조와 네이밍을 기억하고 일관되게 작업합니다. 컨텍스트가 길어져 느려지면 "지금까지 작업 요약해줘" 후 새 세션에 요약을 붙여 이어가세요.
- 각 단계 완료 후 diff를 직접 확인하세요. 특히 API 키 노출 여부, RLS 정책은 사람이 반드시 재검토합니다.
- 단계마다 "conventional commits 형식으로 커밋해줘"를 붙여 GitHub 히스토리를 깔끔하게 유지하세요.
- 스키마 변경 시 `supabase gen types typescript` 재생성을 습관화하세요.
- 배포 전 `.env.example`과 Cloudflare Pages 대시보드 환경변수 목록이 일치하는지 확인해줘"를 루틴으로 요청하세요.

---

## 1단계 — 프로젝트 초기 세팅

```
"Geullog"라는 이름의 React + TypeScript(Vite) 프로젝트를 초기화해줘.
- package.json name을 "geullog"로 설정
- Cloudflare Pages 배포를 전제로 vite.config.ts 설정
- ESLint + Prettier 설정
- 폴더 구조: src/components, src/pages, src/lib(supabase client, openai client),
  src/hooks, src/types, functions/(Cloudflare Pages Functions용)
- .env.example 파일 생성 (OPENAI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY,
  GA_MEASUREMENT_ID, CLARITY_PROJECT_ID 자리 표시)
- README에 로컬 실행 방법 작성
완료 기준: npm run dev로 빈 화면이 정상 렌더링되어야 함
```

## 2단계 — GitHub 연동

```
현재 프로젝트를 git 저장소로 초기화하고 .gitignore(node_modules, .env, dist 등)를 구성해줘.
main 브랜치 보호 규칙을 위한 GitHub Actions CI 워크플로우(.github/workflows/ci.yml)를 작성해줘.
- lint, type-check, build를 PR마다 실행
완료 기준: GitHub Actions 탭에서 워크플로우가 성공적으로 통과해야 함
```

## 3단계 — Supabase 스키마 및 클라이언트

```
Geullog 서비스용 Supabase SQL 마이그레이션 파일을 작성해줘. (supabase/migrations/)
테이블: profiles, generations, generation_versions, templates, usage_logs
- 모든 테이블에 RLS 활성화, 본인 데이터만 접근 가능한 정책 작성
- generations 테이블: input_text, input_image_urls(jsonb), doc_type, style,
  tone, target_audience, length, output_text, tokens_used, created_at
src/lib/supabase.ts에 타입 안전한 클라이언트 생성 코드 작성
supabase gen types typescript 명령으로 타입을 자동 생성하는 npm 스크립트도 추가해줘
완료 기준: supabase db push로 마이그레이션 적용 성공
```

## 4단계 — 인증 (회원가입/로그인)

```
Supabase Auth를 이용해 이메일/구글 소셜 로그인 페이지를 구현해줘.
로그인 성공 시 profiles 테이블에 row가 없으면 자동 생성(트리거 or 클라이언트 로직)
- 신규 가입자에게 무료 크레딧 10개 자동 지급 (profiles.credits)
로그인 상태에 따라 라우트 보호(Protected Route) 구현
완료 기준: 회원가입 → 로그인 → 로그아웃 흐름이 UI에서 정상 동작
```

## 5단계 — 핵심 생성 폼 UI

```
글 생성 입력 폼 컴포넌트를 만들어줘.
필드: 주제/키워드 텍스트, 글 종류(select), 스타일/톤(select), 타겟 독자(select),
분량(select), 언어(select)
- react-hook-form + zod로 유효성 검사
- 재사용 가능한 Select, TextArea 컴포넌트 분리
디자인은 깔끔하고 여백감 있는 SaaS 스타일로, Tailwind 사용
완료 기준: 폼 제출 시 콘솔에 입력값 JSON이 정확히 찍혀야 함
```

## 6단계 — OpenAI 연동 (서버 사이드, 보안 필수)

```
Cloudflare Pages Functions로 /api/generate 엔드포인트를 만들어줘.
- OpenAI API 키는 Cloudflare 환경변수에서만 읽고 절대 클라이언트에 노출 금지
- 요청 바디(doc_type, style, tone, target_audience, length, input_text)를 받아
  글 종류별 시스템 프롬프트 템플릿(src/lib/promptTemplates.ts)을 조합해 OpenAI 호출
- SSE 스트리밍 응답 지원
- 호출 전 사용자의 profiles.credits 확인, 부족하면 402 에러 반환
- 호출 성공 시 credits 차감 + generations 테이블에 저장
완료 기준: 폼 제출 → 실시간 타이핑처럼 글이 스트리밍되어 화면에 출력
```

> ⚠️ **검증 지시문 (6단계 완료 직후 별도로 실행)**
> ```
> /api/generate 엔드포인트의 rate limiting과 credits 차감 로직을 테스트해줘.
> - 크레딧이 0인 사용자가 요청 시 정확히 402를 반환하는지
> - 동시 요청 시 credits가 중복 차감되지 않는지 (race condition 점검)
> - API 키가 클라이언트 번들(dist/)에 포함되지 않는지 빌드 결과물 검사
> ```

## 7단계 — 이미지 업로드 (Vision 연동)

```
이미지 업로드 컴포넌트를 만들어줘. Supabase Storage 버킷(user-uploads)에 업로드하고
signed URL을 생성해줘.
- 업로드 시 파일 크기 5MB 제한, 허용 확장자 jpg/png/webp만 허용
/api/generate 엔드포인트를 확장해서 이미지 URL이 있으면 GPT-4o Vision으로
이미지 설명을 먼저 추출한 뒤 프롬프트에 포함시켜줘
완료 기준: 사진 업로드 후 생성한 글에 사진 내용이 반영되어야 함
```

## 8단계 — 결과 에디터 & 히스토리

```
생성된 글을 리치 텍스트로 편집 가능한 에디터(예: Tiptap) 컴포넌트로 만들어줘.
- 재생성, 톤 조정(더 캐주얼하게/더 격식있게) 버튼
- .docx, .txt 내보내기 기능
- 마이페이지에 히스토리 목록(generations 조회), 클릭 시 상세보기
완료 기준: 히스토리에서 과거 생성물을 불러와 다시 편집 가능해야 함
```

## 9단계 — 분석 도구 연동

```
GA4와 Microsoft Clarity 스크립트를 index.html에 조건부(프로덕션 빌드에서만) 삽입해줘.
GA4 커스텀 이벤트 트래킹 함수(src/lib/analytics.ts)를 만들어서 아래 시점에 이벤트 발생:
- signup_completed, generation_started, generation_completed,
  export_clicked, credit_exhausted, template_used
완료 기준: GA4 실시간 리포트에서 이벤트가 확인되어야 함
```

## 10단계 — 배포 파이프라인

```
GitHub main 브랜치 push 시 Cloudflare Pages에 자동 배포되는 워크플로우를 설정해줘.
프리뷰 배포(PR별 preview URL)도 활성화해줘.
환경변수는 Cloudflare Pages 대시보드 기준으로 문서화(README)해줘.
완료 기준: PR 생성 시 자동으로 preview URL이 코멘트로 달려야 함
```

---

## 11단계 이후 — 트래픽 확보 기능 (Growth Loop)

### 🔁 바이럴 루프
```
"생성된 글을 공유용 페이지(/share/[id])로 공개할 수 있는 기능을 만들어줘.
- 공개 시 OG 태그 자동 생성(제목, 요약, 썸네일)으로 카카오톡/트위터 공유 시 미리보기 노출
- 공유 페이지 하단에 '나도 만들어보기' CTA 버튼 삽입
- 공유 클릭 시 GA4 이벤트(share_clicked) 트래킹"
```

### 🎁 리퍼럴(추천인) 시스템
```
"추천인 코드 시스템을 구현해줘.
- 회원가입 시 ?ref=코드 파라미터 감지 → 추천인/피추천인 모두에게 크레딧 5개 지급
- 마이페이지에 '친구 초대하기' 링크 복사 버튼 추가"
```

### 🆓 비로그인 무료 체험
```
"비로그인 사용자도 1회 무료 체험 생성이 가능하도록 구현해줘.
- 브라우저 fingerprint 또는 IP+localStorage 기반으로 남용 방지
- 체험 후 결과 확인 시 '더 많이 쓰려면 가입하세요' 유도 모달"
```

### 📚 템플릿 갤러리 (SEO + 재방문 유도)
```
"인기 프롬프트/설정 조합을 '템플릿'으로 저장하고 공개 갤러리(/templates)에서
탐색 가능하게 만들어줘.
- 각 템플릿 상세 페이지는 SEO 최적화된 정적 메타데이터 포함
- '이 템플릿으로 시작하기' 버튼 클릭 시 생성 폼에 값 자동 채움"
```

### 🔍 SEO 콘텐츠 허브 (검색 유입)
```
"블로그 섹션(/blog)을 만들어서 'AI로 상품 설명 쓰는 법', 'SNS 캡션 잘 쓰는 팁' 등
콘텐츠 마케팅용 정적 페이지를 MDX로 관리할 수 있게 해줘.
- 각 글 하단에 '지금 AI로 직접 써보기' CTA 삽입"
```

### 📊 재방문 유도 (이메일 요약)
```
"주간 사용 요약을 이메일로 보내는 Supabase Edge Function(cron)을 만들어줘.
- '이번 주 생성한 글 3개, 남은 크레딧 N개' 요약
- Resend 또는 Supabase 기본 SMTP 활용"
```

---

## 스택별 실전 체크리스트

| 영역 | 체크 포인트 |
|---|---|
| **Antigravity** | 세션 컨텍스트 유지, 단계마다 diff 직접 리뷰, 커밋 단위로 작업 |
| **GitHub** | conventional commits, PR마다 CI(lint/type-check/build) 통과 확인 |
| **Cloudflare Pages** | `.env.example` ↔ 대시보드 환경변수 일치 여부 배포 전 확인 |
| **Supabase** | RLS 정책 사람이 직접 SQL 검토, 스키마 변경 시 타입 재생성 습관화 |
| **React/TypeScript** | strict mode 유지, API 키 등 민감정보 클라이언트 번들 노출 여부 빌드 후 검사 |
| **OpenAI API** | rate limiting/credits 로직 별도 검증, 토큰 사용량 usage_logs 실측 확인 |
| **Microsoft Clarity** | 프로덕션 빌드에서만 로드, 개인정보(PII) 마스킹 옵션 활성화 |
| **Google Analytics** | 이벤트 목록 스프레드시트로 먼저 설계 후 에이전트에게 전달 → 누락 방지 |

---

*이 문서는 대화 중 논의된 기획안과 단계별 지시문을 정리한 것으로, 실제 개발 진행 중 세부 요구사항 변경 시 함께 업데이트하는 것을 권장합니다.*
