import { z } from 'zod'
import { DOC_TYPE_CATEGORY } from './constants'

export const docTypeOptions = [
  { value: 'blog', label: '블로그 포스트' },
  { value: 'product', label: '상품 설명' },
  { value: 'sns', label: 'SNS 캡션' },
  { value: 'email', label: '이메일' },
  { value: 'resume', label: '자기소개서' },
  { value: 'press', label: '보도자료' },
] as const

// 정보전달형/스토리텔링형은 (제거된) 서술 유형의 설명/서사와 개념이 중복돼 제거함.
// development_structure(전개 방식)가 그 역할을 대신한다.
export const styleOptions = [
  { value: 'listicle', label: '리스트형' },
  { value: 'qna', label: 'Q&A형' },
] as const

export const toneOptions = [
  { value: 'polite', label: '정중하게' },
  { value: 'friendly', label: '친근하게' },
  { value: 'humorous', label: '유머러스하게' },
  { value: 'professional', label: '전문적으로' },
] as const

export const targetAudienceOptions = [
  { value: 'general', label: '일반 대중' },
  { value: 'twenties_thirties', label: '20-30대' },
  { value: 'expert', label: '전문가' },
  { value: 'parents', label: '부모님 세대' },
  { value: 'student', label: '학생' },
] as const

export const lengthOptions = [
  { value: 'short', label: '짧게 (~200자)' },
  { value: 'medium', label: '보통 (~500자)' },
  { value: 'long', label: '길게 (~1000자)' },
] as const

// Quick-pick defaults. Any other language is typed in freely (see the
// "직접 입력" toggle in GenerationForm) rather than listed here.
export const languageOptions = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
] as const

export const outputFormatOptions = [
  { value: 'markdown', label: '마크다운 (소제목/목록 구조화)' },
  { value: 'plain', label: '일반 텍스트' },
] as const

function valuesOf<T extends { value: string }>(options: readonly T[]) {
  return options.map((option) => option.value) as [string, ...string[]]
}

const baseGenerationFormSchema = z.object({
  // 필수 4개 — 이것만 채워도 바로 생성 가능해야 한다.
  inputText: z.string().trim().min(1, '주제나 키워드를 입력해주세요'),
  docType: z.enum(valuesOf(docTypeOptions), { message: '글 종류를 선택해주세요' }),
  targetAudience: z.enum(valuesOf(targetAudienceOptions), {
    message: '타겟 독자를 선택해주세요',
  }),
  additionalInstruction: z.string().trim().optional(),

  // 나머지는 전부 선택(고급 설정) — plain string으로 느슨하게 받아서, <select>의
  // "선택 안 함"(빈 문자열)이 그대로 optional 미지정으로 취급되게 한다(빈 문자열은 JS에서
  // falsy라 프롬프트 조합 시 자연스럽게 걸러짐). z.enum을 쓰지 않는 이유는 z.preprocess로
  // 빈 문자열→undefined 변환을 시도하면 react-hook-form의 zodResolver 타입 추론이 깨지기
  // 때문(입력 타입이 unknown으로 넓어짐).
  style: z.string().optional(),
  tone: z.string().optional(),
  length: z.string().optional(),
  language: z.string().trim().optional(),
  inputImageUrls: z.array(z.string()),
  developmentStructure: z.string().optional(),
  authorStyleId: z.string().optional(),
  stylePreset: z.string().optional(),
  imageMode: z.enum(['ocr', 'describe']).optional(),
  seoKeywords: z.string().trim().optional(),
  outputFormat: z.string().optional(),
  continueFromGenerationId: z.string().optional(),
})

export const generationFormSchema = baseGenerationFormSchema.superRefine((data, ctx) => {
  const category = DOC_TYPE_CATEGORY[data.docType]

  if (category === 'practical' && data.authorStyleId) {
    ctx.addIssue({
      code: 'custom',
      path: ['authorStyleId'],
      message: '실용형 글 종류에는 작가 스타일을 적용할 수 없습니다',
    })
  }
  if (category === 'creative' && data.stylePreset) {
    ctx.addIssue({
      code: 'custom',
      path: ['stylePreset'],
      message: '창작형 글 종류에는 문체 프리셋을 적용할 수 없습니다',
    })
  }

  if (data.inputImageUrls.length > 0 && !data.imageMode) {
    ctx.addIssue({
      code: 'custom',
      path: ['imageMode'],
      message: '사진 사용 방식을 선택해주세요',
    })
  }
})

export type GenerationFormValues = z.infer<typeof baseGenerationFormSchema>

export const regenerateRequestSchema = z.object({
  generationId: z.string(),
  mode: z.enum(['regenerate', 'more_casual', 'more_formal']),
  currentText: z.string().optional(),
})

export type RegenerateRequest = z.infer<typeof regenerateRequestSchema>
