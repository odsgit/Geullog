import { z } from 'zod'

export const docTypeOptions = [
  { value: 'blog', label: '블로그 포스트' },
  { value: 'product', label: '상품 설명' },
  { value: 'sns', label: 'SNS 캡션' },
  { value: 'email', label: '이메일' },
  { value: 'resume', label: '자기소개서' },
  { value: 'press', label: '보도자료' },
] as const

export const styleOptions = [
  { value: 'informative', label: '정보 전달형' },
  { value: 'storytelling', label: '스토리텔링형' },
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

export const languageOptions = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
  { value: 'ja', label: '日本語' },
] as const

function valuesOf<T extends { value: string }>(options: readonly T[]) {
  return options.map((option) => option.value) as [string, ...string[]]
}

export const generationFormSchema = z.object({
  inputText: z.string().trim().min(1, '주제나 키워드를 입력해주세요'),
  docType: z.enum(valuesOf(docTypeOptions), { message: '글 종류를 선택해주세요' }),
  style: z.enum(valuesOf(styleOptions), { message: '스타일을 선택해주세요' }),
  tone: z.enum(valuesOf(toneOptions), { message: '톤을 선택해주세요' }),
  targetAudience: z.enum(valuesOf(targetAudienceOptions), {
    message: '타겟 독자를 선택해주세요',
  }),
  length: z.enum(valuesOf(lengthOptions), { message: '분량을 선택해주세요' }),
  language: z.enum(valuesOf(languageOptions), { message: '언어를 선택해주세요' }),
  inputImageUrls: z.array(z.string()),
})

export type GenerationFormValues = z.infer<typeof generationFormSchema>

export const regenerateRequestSchema = z.object({
  generationId: z.string(),
  mode: z.enum(['regenerate', 'more_casual', 'more_formal']),
  currentText: z.string().optional(),
})

export type RegenerateRequest = z.infer<typeof regenerateRequestSchema>
