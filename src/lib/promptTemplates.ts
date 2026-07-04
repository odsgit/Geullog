import type { GenerationFormValues } from './generationSchema'

const docTypeInstructions: Record<string, string> = {
  blog: '블로그 포스트 형식으로, 도입-본론-결론 구조를 갖춰 작성하세요.',
  product: '온라인 쇼핑몰에 게시할 상품 설명으로, 특징과 장점을 매력적으로 전달하세요.',
  sns: 'SNS(인스타그램/트위터 등)에 게시할 짧고 임팩트 있는 캡션으로 작성하세요.',
  email: '이메일 본문으로, 인사말과 맺음말을 포함해 작성하세요.',
  resume: '자기소개서 항목으로, 구체적인 경험과 성과를 중심으로 작성하세요.',
  press: '보도자료 형식으로, 핵심 정보를 육하원칙에 따라 명확하게 전달하세요.',
}

const styleInstructions: Record<string, string> = {
  informative: '정보를 명확하고 체계적으로 전달하는 정보 전달형으로 작성하세요.',
  storytelling: '이야기를 들려주듯 스토리텔링 기법으로 작성하세요.',
  listicle: '핵심 포인트를 나열하는 리스트 형식으로 작성하세요.',
  qna: '질문과 답변 형식(Q&A)으로 작성하세요.',
}

const toneInstructions: Record<string, string> = {
  polite: '정중하고 예의 바른 어조를 사용하세요.',
  friendly: '친근하고 편안한 어조를 사용하세요.',
  humorous: '유머러스하고 재치있는 어조를 사용하세요.',
  professional: '전문적이고 신뢰감 있는 어조를 사용하세요.',
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
  ja: '日本語で書いてください。',
}

export const NO_MARKDOWN_INSTRUCTION =
  '#, *, - 같은 마크다운 문법은 사용하지 말고 일반 텍스트로만 작성하세요.'

export function buildPrompt(input: GenerationFormValues, imageDescription?: string | null) {
  const system = [
    '당신은 전문 카피라이터이자 콘텐츠 작가입니다.',
    NO_MARKDOWN_INSTRUCTION,
    docTypeInstructions[input.docType],
    styleInstructions[input.style],
    toneInstructions[input.tone],
    targetAudienceInstructions[input.targetAudience],
    lengthInstructions[input.length],
    languageInstructions[input.language],
  ]
    .filter(Boolean)
    .join(' ')

  const user = imageDescription
    ? `${input.inputText}\n\n[첨부된 사진 설명]\n${imageDescription}\n\n위 사진 내용을 자연스럽게 반영해서 작성하세요.`
    : input.inputText

  return { system, user }
}
