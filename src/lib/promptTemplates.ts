import type { GenerationFormValues } from './generationSchema'
import { findDevelopmentStructure, type DevelopmentStructure } from './constants'

const docTypeInstructions: Record<string, string> = {
  blog: '블로그 포스트 형식으로, 도입-본론-결론 구조를 갖춰 작성하세요.',
  product: '온라인 쇼핑몰에 게시할 상품 설명으로, 특징과 장점을 매력적으로 전달하세요.',
  sns: 'SNS(인스타그램/트위터 등)에 게시할 짧고 임팩트 있는 캡션으로 작성하세요.',
  email: '이메일 본문으로, 인사말과 맺음말을 포함해 작성하세요.',
  resume: '자기소개서 항목으로, 구체적인 경험과 성과를 중심으로 작성하세요.',
  press: '보도자료 형식으로, 핵심 정보를 육하원칙에 따라 명확하게 전달하세요.',
}

const styleInstructions: Record<string, string> = {
  listicle: '핵심 포인트를 나열하는 리스트 형식으로 작성하세요.',
  qna: '질문과 답변 형식(Q&A)으로 작성하세요.',
}

const toneInstructions: Record<string, string> = {
  polite: '정중하고 예의 바른 어조를 사용하세요.',
  friendly: '친근하고 편안한 어조를 사용하세요.',
  humorous: '유머러스하고 재치있는 어조를 사용하세요.',
  professional: '전문적이고 신뢰감 있는 어조를 사용하세요.',
}

const stylePresetInstructions: Record<string, string> = {
  concise: '군더더기 없이 간결하고 명확한 문장으로 작성하세요.',
  lyrical: '서정적이고 정서가 풍부한 문장으로 작성하세요.',
  humorous_preset: '유머러스하고 재치있는 문장으로 작성하세요.',
  trustworthy: '신뢰감을 주는 안정적이고 전문적인 문장으로 작성하세요.',
}

const targetAudienceInstructions: Record<string, string> = {
  general: '일반 대중 독자를 대상으로 누구나 이해하기 쉽게 작성하세요.',
  twenties_thirties: '20-30대 독자에게 공감을 살 수 있도록 작성하세요.',
  expert: '해당 분야 전문가 독자를 대상으로 전문 용어를 적절히 사용해 작성하세요.',
  parents: '부모님 세대 독자가 편안하게 읽을 수 있도록 작성하세요.',
  student: '학생 독자가 이해하기 쉽도록 작성하세요.',
}

const lengthInstructions: Record<string, string> = {
  short: '약 200자 내외의 짧은 분량으로 작성하세요.',
  medium: '약 500자 내외의 보통 분량으로 작성하세요.',
  long: '약 1000자 내외의 긴 분량으로 작성하세요.',
}

const languageInstructions: Record<string, string> = {
  ko: '한국어로 작성하세요.',
  en: 'Write in English.',
}

// Falls back to a generic instruction for any language the user typed in
// themselves beyond the ko/en quick picks (e.g. "프랑스어", "베트남어"). 언어를
// 아예 지정하지 않으면 한국어로 기본 작성한다.
function languageInstruction(language?: string): string {
  const resolved = language || 'ko'
  return languageInstructions[resolved] ?? `${resolved}로 작성하세요.`
}

// 마크다운을 강제하는 실용형 구조(아래 developmentStructureInstruction)와 충돌하므로
// NO_MARKDOWN_INSTRUCTION은 더 이상 buildPrompt의 기본 시스템 프롬프트에 넣지 않는다.
// 톤 조정(더 캐주얼/격식있게)처럼 구조 강제가 필요 없는 짧은 재작성에서만 계속 사용한다.
export const NO_MARKDOWN_INSTRUCTION =
  '#, *, - 같은 마크다운 문법은 사용하지 말고 일반 텍스트로만 작성하세요.'

// 전개방식별 구조 강제 지시. 실용형(소제목/불릿 예시 few-shot 포함)과 문학형(빈 줄
// 문단 구분만, 소제목 강제 금지)을 분기한다 — 문학형에 소제목을 강제하면 톤이 깨진다.
// forcePlain(출력 형식='일반 텍스트')이면 실용형이라도 소제목을 강제하지 않는다.
function developmentStructureInstruction(structure: DevelopmentStructure, forcePlain: boolean): string {
  const stepsList = structure.structureSteps.join(' → ')
  const common = `당신은 유저가 선택한 [${structure.label}] 전개 방식(${stepsList})에 맞춰 글을 작성해야 합니다. 독자가 글의 구조를 직관적으로 파악할 수 있도록 반드시 문단을 명확히 분리하십시오. 각 단계가 바뀔 때마다 줄 바꿈을 2번(빈 줄 하나)하여 단락을 확실히 구분하세요.`

  if (structure.practical && !forcePlain) {
    const fewShot = structure.structureSteps.map((step) => `## ${step}\n(내용)`).join('\n\n')
    return `${common} 각 단계마다 소제목(##)이나 필요하면 불릿(-)을 적극 활용해 다음과 같은 형식을 따르세요:\n${fewShot}`
  }

  return `${common} 소제목은 사용하지 말고, 단락 구분(빈 줄)만으로 전환을 표현하세요.`
}

interface AuthorStyleInfo {
  description: string
  tier: string
  traits: string[] | null
}

// tier2(재현 신뢰도가 낮은 희소 데이터 작가)는 이름과 설명만 언급하는 대신, 조사해둔
// 구체적 traits를 불릿으로 직접 주입해 모델의 암묵적 지식 부족을 보완한다.
function authorStyleInstruction(authorStyle: AuthorStyleInfo): string {
  if (authorStyle.tier === 'tier2' && authorStyle.traits && authorStyle.traits.length > 0) {
    const bullets = authorStyle.traits.map((trait) => `- ${trait}`).join('\n')
    return `다음 문체적 특징을 반드시 반영해서 작성하세요:\n${bullets}`
  }
  return `다음 문체를 참고해서 작성하세요: ${authorStyle.description}`
}

export function buildPrompt(
  input: GenerationFormValues,
  imageDescription?: string | null,
  authorStyle?: AuthorStyleInfo | null,
  continuationContext?: string | null,
) {
  const structure = input.developmentStructure
    ? findDevelopmentStructure(input.developmentStructure)
    : undefined
  const isPlainFormat = input.outputFormat === 'plain'
  const seoKeywords = input.seoKeywords
    ?.split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)

  const system = [
    '당신은 전문 카피라이터이자 콘텐츠 작가입니다.',
    docTypeInstructions[input.docType],
    input.style ? styleInstructions[input.style] : null,
    input.tone ? toneInstructions[input.tone] : null,
    input.stylePreset ? stylePresetInstructions[input.stylePreset] : null,
    targetAudienceInstructions[input.targetAudience],
    input.length ? lengthInstructions[input.length] : null,
    languageInstruction(input.language),
    structure ? developmentStructureInstruction(structure, isPlainFormat) : null,
    isPlainFormat ? NO_MARKDOWN_INSTRUCTION : null,
    authorStyle ? authorStyleInstruction(authorStyle) : null,
    seoKeywords?.length ? `다음 SEO 키워드를 문맥에 자연스럽게 포함하세요: ${seoKeywords.join(', ')}` : null,
    input.additionalInstruction ? `추가 요청사항: ${input.additionalInstruction}` : null,
    continuationContext
      ? '이것은 여러 부분으로 이어지는 긴 글의 다음 부분입니다. 이전 내용의 문체, 등장인물, 설정과의 일관성을 유지하며 자연스럽게 이어서 작성하세요.'
      : null,
  ]
    .filter(Boolean)
    .join(' ')

  const imageLabel = input.imageMode === 'ocr' ? '사진 속 텍스트' : '사진 분위기 묘사'

  const user = [
    continuationContext ? `[이전 내용]\n${continuationContext}` : null,
    imageDescription ? `[${imageLabel}]\n${imageDescription}` : null,
    continuationContext
      ? `[다음 부분에 대한 지시]\n${input.inputText}\n\n위 이전 내용에 자연스럽게 이어서 다음 부분을 작성하세요.`
      : imageDescription
        ? `${input.inputText}\n\n위 사진 내용을 자연스럽게 반영해서 작성하세요.`
        : input.inputText,
  ]
    .filter(Boolean)
    .join('\n\n')

  return { system, user }
}
