# Geullog v2.0 리팩토링 지시문 (통합본)

> v1.0 운영 중 발견된 6가지 문제(작가 스타일 부조화, 필드 중복, 희소 작가 재현 실패, 이미지 모드 불명확, 통글 출력)와
> **버전 되돌리기(Revert) 기능**까지 하나로 통합한 최종 지시문입니다.
> Antigravity의 Claude 에이전트에게 STEP 순서대로 붙여넣으세요. 같은 세션에서 이어가면 폴더 구조/네이밍 일관성이 유지됩니다.

---

## 0. 문제 → 해결책 매핑

| # | 문제 | 근본 원인 | 해결 방향 |
|---|---|---|---|
| 1 | 작가 스타일 × 실용 문서(상품설명·보도자료) 조합이 어색함 | '작가 스타일'이 모든 doc_type에 무차별 노출됨 | doc_type을 창작형/실용형으로 분류, 실용형은 문체 프리셋으로 대체 |
| 2 | 서술유형 '설명' = 스타일 '정보전달형' 중복 | 두 필드가 같은 개념을 다른 이름으로 관리 | '전개 방식' 단일 필드로 통합 |
| 3 | 서술유형 '서사' = 스타일 '스토리텔링형' 중복 | 위와 동일 | 위와 동일 |
| 4 | 희소 데이터 작가(크라스나호르카이, 채만식 등) 문체 재현 실패 | 모델의 암묵적 지식에만 의존 | 작가 재현 신뢰도 티어링 + traits 명시 주입 |
| 5 | 이미지 업로드 시 OCR/분위기 묘사 중 무엇을 하는지 불명확 | 모드 선택 UI 자체가 없음 | 업로드 시 모드 명시 토글 추가 |
| 6 | 생성물이 통글로 출력됨 | 시스템 프롬프트에 구조 강제 지시 없음 + 프론트가 줄바꿈 무시 | 백엔드: 마크다운 구조 강제 / 프론트: react-markdown 렌더링 |
| + | 히스토리에서 과거 버전으로 되돌리기 불가 | 되돌리기 기능 자체 부재 | git revert 방식(append-only)으로 버전 되돌리기 구현 |

---

## 1. 새 데이터 모델

| 필드 | 상태 | 비고 |
|---|---|---|
| `doc_type` (글 종류) | 유지 | 창작형/실용형 카테고리 태그 추가 |
| `development_structure` (전개 방식) | **신규, 필수** | 3단구성/5단구성/두괄식/역피라미드/PREP/기승전결/소설5단/영웅의여정/병렬식/시공간흐름 |
| `tone` (톤) | 축소 | '정보전달형', '스토리텔링형' 옵션 삭제. 순수 정서 형용사만 유지 |
| `author_style` (작가 스타일) | 조건부 노출 | doc_type이 창작형일 때만 노출. 티어 정보 포함 |
| `target_audience`, `length`, `language` | 유지 | 변경 없음 |
| `current_version_id` (generations) | **신규** | 현재 활성 버전 포인터 |
| `version_type` (generation_versions) | **신규** | 'generated' \| 'reverted' \| 'tone_adjusted' |

---

## STEP A. 스키마·타입 정리

```
[목표] Geullog의 생성 옵션 데이터 모델을 정리해서 필드 중복을 제거하고 전개방식 필드를 추가한다.

[컨텍스트]
- supabase/migrations/ 내 generations 테이블 (doc_type, style, tone, target_audience, length 컬럼 존재)
- src/types/generation.ts (또는 supabase gen types 결과물)

[작업 내용]
1. generations 테이블에 development_structure TEXT NOT NULL 컬럼 추가 (마이그레이션 파일 신규 생성)
2. 기존 style 컬럼에서 '정보전달형', '스토리텔링형' 값을 사용하는 로직 제거
3. author_style 컬럼에 author_tier TEXT ('tier1' | 'tier2' | null) 컬럼 추가
4. src/lib/constants.ts 에 아래 두 개의 상수 정의
   - DEVELOPMENT_STRUCTURES: { key, label, description, structureSteps: string[] }[] (표 10종)
   - DOC_TYPE_CATEGORY: Record<docType, 'creative' | 'practical'>
5. supabase gen types typescript 재실행

[제약조건]
- 기존 generations row는 development_structure를 nullable로 마이그레이션 후 백필하지 말고, 이후 생성분부터 필수 적용
- 컬럼명은 스네이크케이스(DB) / 카멜케이스(TS) 컨벤션 유지

[완료 기준] supabase db push 성공 + npm run gen:types 실행 후 타입 에러 없이 빌드됨
```

---

## STEP B. 폼 UI 재구성 (작가 스타일 가드레일 포함)

```
[목표] 생성 폼에서 '전개 방식'을 필수 선택지로 추가하고, doc_type에 따라 작가 스타일 노출 여부를 다르게 제어한다.

[컨텍스트]
- src/components/GenerationForm.tsx
- src/lib/constants.ts 의 DEVELOPMENT_STRUCTURES, DOC_TYPE_CATEGORY

[작업 내용]
1. doc_type select 아래에 '전개 방식' select 추가. 선택 시 description(핵심 구조, 적합한 글 종류)을 하단에 노출
2. doc_type이 'practical'이면 author_style select를 숨기고 '문체 프리셋'(간결체/서정체/유머러스체/신뢰감 있는 문체 등) select로 대체
3. 'creative'인 경우에만 author_style select 노출. tier2 작가 선택 시 하단에 경고 문구 표시: "이 작가는 데이터가 적어 문체 재현 정확도가 낮을 수 있습니다"
4. tone select에서 '정보전달형', '스토리텔링형' 옵션 제거
5. zod 스키마에 development_structure required, author_style은 doc_type이 creative일 때만 required가 되도록 조건부 검증(superRefine) 추가

[제약조건]
- 기존 필드 레이아웃과 톤을 크게 벗어나지 않는 선에서 select 1개만 추가
- practical에서 author_style이 서버에 실수로 전달되지 않도록 payload 구성 시 명시적으로 제외

[완료 기준] doc_type을 '상품설명'으로 바꾸면 작가 스타일 select가 사라지고 문체 프리셋이 나타나며, '에세이'로 바꾸면 반대로 동작함
```

---

## STEP C. 작가 스타일 티어링 & 전개방식 프롬프트 템플릿

```
[목표] 작가 스타일의 재현 신뢰도를 티어로 관리하고, 전개방식별로 구조가 강제되는 시스템 프롬프트를 만든다.

[컨텍스트]
- src/lib/promptTemplates.ts
- functions/api/generate.ts

[작업 내용]
1. src/lib/authorStyles.ts 신규 생성. 구조:
   { name, tier: 'tier1' | 'tier2', traits: string[] (문체 특징 3~5개 서술어), avoidNote?: string }
   - tier1: 헤밍웨이, 카프카, 김훈, 무라카미 하루키 등
   - tier2: 크라스나호르카이, 채만식, 최명희 등 — traits를 사람이 직접 조사해서 구체적으로 채워넣기
2. author_style이 tier2면 이름만 언급하지 말고 traits 배열을 시스템 프롬프트에 불릿으로 직접 주입
3. DEVELOPMENT_STRUCTURES 각 항목에 대응하는 구조 템플릿을 promptTemplates.ts에 정의 (PREP, 역피라미드, 소설5단 등 예시는 STEP E 참고)
4. functions/api/generate.ts에서 development_structure, author_style(tier 포함) 값을 받아 위 로직으로 시스템 프롬프트를 조합

[제약조건]
- tier2 작가 traits는 최소 3개 이상 구체적 서술어로 작성 (막연한 "독특한 문체" 같은 표현 금지)
- 문학형 전개방식에는 소제목을 강제하지 않고, 실용형에는 소제목을 강제

[완료 기준]
- 전개방식 10종을 각각 생성했을 때, 실용형은 소제목 기반, 문학형은 문단 구분 기반 구조가 육안으로 확인됨
- tier2 작가 선택 시 traits에 명시한 특징이 실제로 반영되는지 3회 이상 샘플 확인
```

---

## STEP D. 이미지 업로드 모드 분리

```
[목표] 이미지 업로드 시 'OCR(텍스트 추출)'과 '분위기 묘사' 중 하나를 유저가 명시적으로 선택하게 한다.

[컨텍스트]
- src/components/ImageUpload.tsx
- functions/api/generate.ts 의 Vision 처리 로직

[작업 내용]
1. 업로드 컴포넌트에 라디오 버튼 2개 추가: "① 사진 속 글자 읽기" / "② 사진 분위기·내용 묘사"
2. 업로드 payload에 image_mode: 'ocr' | 'describe' 필드 추가
3. image_mode에 따라 서로 다른 vision 프롬프트 사용
   - ocr: "이미지에 포함된 텍스트를 빠짐없이 정확하게 그대로 추출하라. 해석하거나 요약하지 마라."
   - describe: "이미지의 분위기, 색감, 구도, 피사체의 인상을 감각적인 언어로 묘사하라. 텍스트가 있어도 무시하라."
4. 추출/묘사 결과 삽입 시 "[사진 속 텍스트]" 또는 "[사진 분위기 묘사]" 라벨 부착

[제약조건]
- image_mode 미선택 시 제출 버튼 비활성화

[완료 기준] 텍스트 이미지+OCR 모드 시 텍스트가 그대로 반영되고, 풍경 사진+묘사 모드 시 분위기 묘사만 반영됨. 모드만 바꿔 2회 생성 시 결과가 명확히 달라야 함
```

---

## STEP E. 백엔드 — 마크다운 구조 강제 (전개방식별 시스템 프롬프트 보완)

```
[목표] OpenAI API가 전개방식의 각 단계를 마크다운 문단/소제목으로 명확히 구분해서 출력하도록 시스템 프롬프트를 보완한다.

[컨텍스트]
- src/lib/promptTemplates.ts
- functions/api/generate.ts

[작업 내용]
1. 모든 전개방식 시스템 프롬프트 공통 규칙에 아래 내용을 동적으로 삽입한다:
   "당신은 유저가 선택한 [{development_structure}] 전개 방식에 맞춰 글을 작성해야 합니다.
    독자가 글의 구조를 직관적으로 파악할 수 있도록 반드시 문단(Paragraph)을 명확히 분리하십시오.
    각 단계가 바뀔 때마다 줄 바꿈을 2번(\n\n) 하여 단락을 확실히 구분하고,
    실용형 글(3단/5단 구성, PREP, 역피라미드)에는 소제목(##)이나 불릿(-)을 적극 활용하고,
    문학형 글(기승전결, 소설5단, 영웅의 여정)에는 소제목 없이 단락 구분(빈 줄)만으로 전환을 표현하십시오."
2. 실용형 템플릿에는 단계별 소제목 예시를 few-shot으로 포함시켜 형식을 고정한다.
   예) PREP: "## 핵심 결론\n(내용)\n\n## 이유 및 근거\n(내용)\n\n## 구체적 사례\n(내용)\n\n## 결론 재강조\n(내용)"
3. output_text 저장 전, \n\n이 전혀 없거나 500자 이상 끊김 없이 이어지면 로그를 남긴다 (모니터링용, 재시도는 하지 않음)

[제약조건]
- 문학형 전개방식에 소제목을 강제하면 톤이 깨지므로 DOC_TYPE_CATEGORY 및 전개방식 종류에 따라 분기
- 시스템 프롬프트가 과도하게 길어지지 않도록 선택된 전개방식의 규칙만 동적 삽입

[완료 기준] 전개방식 10종 각각 생성 시, 실용형은 ## 소제목, 문학형은 빈 줄 문단 구분이 output_text에 실제로 포함됨
```

---

## STEP F. 프론트엔드 — 마크다운 렌더링 및 문단 가독성 스타일링

```
[목표] 백엔드가 마크다운/줄바꿈 형태로 내려주는 텍스트를 프론트엔드에서 구조가 살아있는 형태로 렌더링한다.

[컨텍스트]
- 결과 에디터(Tiptap) 및 히스토리 상세 컴포넌트
- SSE 스트리밍으로 들어오는 output_text
- Tailwind CSS 사용 중

[작업 내용]
1. react-markdown 설치: npm install react-markdown
2. Tailwind Typography 플러그인 설치: npm install -D @tailwindcss/typography
   (tailwind.config.js plugins에 require('@tailwindcss/typography') 추가)
3. 결과 표시 컴포넌트:
   ```tsx
   import ReactMarkdown from 'react-markdown';

   <div className="prose max-w-none leading-relaxed">
     <ReactMarkdown>{generatedText}</ReactMarkdown>
   </div>
   ```
4. 스트리밍 중에는 매 청크마다 누적된 전체 텍스트를 다시 ReactMarkdown에 통째로 넘겨 재파싱한다 (부분 파싱 캐싱 금지)
5. Tiptap 에디터로 옮길 때는 tiptap-markdown 확장 등으로 ##, 빈 줄 구분이 실제 heading/paragraph 노드로 들어가도록 변환
6. 부담이 적은 간단 미리보기 화면에는 최소 대안으로 whitespace-pre-line 적용:
   ```tsx
   <div className="whitespace-pre-line text-gray-800 leading-relaxed space-y-4">
     {generatedText}
   </div>
   ```

[제약조건]
- react-markdown이 임의 HTML을 실행하지 않도록 기본 설정 유지 (rehype-raw 등 추가 금지, XSS 방지)
- Tiptap 에디터와 미리보기(react-markdown) 스타일이 최대한 일치하도록 prose 클래스 기준 통일

[완료 기준]
- 스트리밍 중에도 소제목/문단 구분이 실시간 반영
- 히스토리에서 다시 열어도 구조 유지
- 통글 텍스트가 하나도 없을 때까지 전개방식 10종 육안 검수
```

---

## STEP G. 구조 시각화 배지 (선택, 고급 기능)

```
[목표] 유저가 선택한 전개방식의 각 단계를 결과물 옆에 배지(Badge)로 표시해서 신뢰감과 완성도를 높인다.

[컨텍스트]
- STEP F에서 렌더링된 결과 컴포넌트
- src/lib/constants.ts 의 DEVELOPMENT_STRUCTURES

[작업 내용]
1. output_text를 ## 소제목 기준으로 파싱해서 각 섹션 제목을 추출 (react-markdown의 h2 렌더링 커스텀 오버라이드)
2. 각 섹션 상단에 옅은 회색/브랜드 컬러 칩으로 단계명 표시. 예: [Point: 결론], [Reason: 근거]
3. 문학형 전개방식(소제목 없음)은 배지 대신 좌측 세로 타임라인 바 + 단계명 텍스트로 대체

[제약조건]
- STEP E/F가 안정적으로 동작한 뒤에만 진행 (텍스트 구조가 일관돼야 배지 파싱이 정확함)
- 배지가 본문보다 시각적으로 튀지 않도록 폰트 크기/색상 최소화

[완료 기준] 실용형 글에서 각 문단 위에 단계 배지가 정확히 표시되고, 문학형 글에서는 세로 타임라인이 표시됨
```

---

## STEP H. 버전 되돌리기(Revert) 기능

```
[목표] 히스토리에서 특정 버전을 선택하면 해당 버전의 내용으로 되돌리되(revert), 기존 버전은 삭제하지 않고 새 버전으로 기록되는 기능을 구현한다.

[컨텍스트]
- generation_versions 테이블 (generation_id FK, output_text, created_at 등 보유 가정)
- src/components/HistoryDetail.tsx
- generations 테이블: 현재 활성 버전을 가리키는 포인터 컬럼 없음

[작업 내용]
1. generations 테이블에 current_version_id UUID REFERENCES generation_versions(id) 컬럼 추가
2. generation_versions 테이블에 version_type TEXT ('generated' | 'reverted' | 'tone_adjusted') 컬럼 추가
3. 버전 목록 UI: generation_versions를 created_at 역순 타임라인으로 나열, 항목 클릭 시 미리보기 + "이 버전으로 되돌리기" 버튼
4. "이 버전으로 되돌리기" 클릭 시 서버 로직:
   a. 선택된 version의 output_text를 복사해서 generation_versions에 새 row INSERT (version_type='reverted')
   b. generations.current_version_id를 새 row의 id로 UPDATE
   c. 기존 버전은 절대 DELETE/UPDATE하지 않음
5. 결과 에디터는 항상 generations.current_version_id가 가리키는 버전을 렌더링
6. GA4 이벤트 version_reverted 추가 (analytics.ts에 등록)

[제약조건]
- 되돌리기는 반드시 새 row 추가 방식으로만 구현 (기존 output_text UPDATE 금지)
- RLS 정책: generation_versions INSERT/UPDATE도 본인 소유 generation_id에 대해서만 허용되는지 재확인
- "되돌린 버전"을 다시 되돌리는 것도 동일 로직으로 자연히 해결됨 (특수 분기 불필요)

[완료 기준]
- A→B→C 생성 후 A로 되돌리면 A/B/C/A'(reverted) 4개가 모두 남고 현재 활성 버전은 A'
- 새로고침 후에도 current_version_id 기준으로 A' 표시
- 다른 계정으로 교차 테스트해서 RLS 우회 불가 확인
```

---

## 사람이 직접 검토해야 할 부분 (자동화 금지 지점)

| 항목 | 이유 |
|---|---|
| RLS 정책 전체 (특히 generation_versions INSERT/UPDATE) | 다른 유저의 데이터를 건드릴 수 없는지 SQL 레벨에서 직접 확인 |
| current_version_id UPDATE 트랜잭션 | INSERT와 UPDATE가 원자적으로 묶여있는지 확인 — 하나만 실패하면 데이터 불일치 발생 |
| tier2 작가 traits 내용 | 에이전트에게 맡기지 말고 직접 조사해서 채워넣기 |
| react-markdown 보안 설정 | rehype-raw 등 HTML 실행 확장이 추가되지 않았는지 diff 확인 |

## 개정 체크리스트 (v2.0 통합본)

- [ ] '서술유형' 필드 완전 제거 (DB, 타입, UI 전부)
- [ ] tone select에 정보전달형/스토리텔링형 잔존 여부 확인
- [ ] practical 문서에서 author_style이 UI/payload 어디에도 안 나타나는지 확인
- [ ] tier2 작가 traits가 실제로 시스템 프롬프트에 주입되는지 network 탭 확인
- [ ] image_mode 없이 제출이 안 되는지 확인
- [ ] 전개방식 10종 각각 생성 테스트 → 구조 마커 육안 확인
- [ ] 스트리밍 중 마크다운이 깨지지 않고 누적 재파싱되는지 확인
- [ ] A→B→C→A' 되돌리기 시나리오에서 4개 버전 모두 DB에 남는지 확인
- [ ] 다른 계정 교차 테스트로 RLS 우회 불가 확인
