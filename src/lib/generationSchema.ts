import { z } from 'zod'
import { DOC_TYPE_CATEGORY, DEVELOPMENT_STRUCTURES, stylePresetOptions } from './constants'

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

function valuesOf<T extends { value: string }>(options: readonly T[]) {
  return options.map((option) => option.value) as [string, ...string[]]
}

const developmentStructureKeys = DEVELOPMENT_STRUCTURES.map((structure) => structure.key) as [
  string,
  ...string[],
]
const stylePresetKeys = valuesOf(stylePresetOptions)

const baseGenerationFormSchema = z.object({
  inputText: z.string().trim().min(1, '주제나 키워드를 입력해주세요'),
  docType: z.enum(valuesOf(docTypeOptions), { message: '글 종류를 선택해주세요' }),
  style: z.enum(valuesOf(styleOptions), { message: '스타일을 선택해주세요' }),
  tone: z.enum(valuesOf(toneOptions), { message: '톤을 선택해주세요' }),
  targetAudience: z.enum(valuesOf(targetAudienceOptions), {
    message: '타겟 독자를 선택해주세요',
  }),
  length: z.enum(valuesOf(lengthOptions), { message: '분량을 선택해주세요' }),
  language: z.string().trim().min(1, '언어를 선택해주세요'),
  inputImageUrls: z.array(z.string()),
  developmentStructure: z.enum(developmentStructureKeys, { message: '전개 방식을 선택해주세요' }),
  authorStyleId: z.string().optional(),
  stylePreset: z.enum(stylePresetKeys).optional(),
  imageMode: z.enum(['ocr', 'describe']).optional(),
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
