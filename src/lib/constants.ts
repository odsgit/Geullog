import type { GenerationFormValues } from './generationSchema'

// Whether a doc_type is a literary/personal-voice type (author style makes
// sense) or a functional/business type (a style preset makes more sense than
// impersonating a novelist). Drives which select GenerationForm shows.
export const DOC_TYPE_CATEGORY: Record<GenerationFormValues['docType'], 'creative' | 'practical'> =
  {
    blog: 'creative',
    product: 'practical',
    sns: 'practical',
    email: 'practical',
    resume: 'practical',
    press: 'practical',
  }

export const stylePresetOptions = [
  { value: 'concise', label: '간결체' },
  { value: 'lyrical', label: '서정체' },
  { value: 'humorous_preset', label: '유머러스체' },
  { value: 'trustworthy', label: '신뢰감 있는 문체' },
] as const

export interface DevelopmentStructure {
  key: string
  label: string
  description: string
  structureSteps: string[]
  /** true면 실용형(소제목/불릿 강제), false면 문학형(빈 줄 문단 구분만) */
  practical: boolean
}

export const DEVELOPMENT_STRUCTURES: DevelopmentStructure[] = [
  {
    key: 'three_part',
    label: '3단 구성',
    description: '서론-본론-결론의 가장 기본적인 3단 구조. 에세이, 발표문 등 폭넓게 적합합니다.',
    structureSteps: ['서론', '본론', '결론'],
    practical: true,
  },
  {
    key: 'five_part',
    label: '5단 구성',
    description: '서론과 결론 사이 본론을 세 갈래로 나눠 논지를 다각도로 전개합니다. 보고서, 발표문에 적합합니다.',
    structureSteps: ['서론', '본론 1', '본론 2', '본론 3', '결론'],
    practical: true,
  },
  {
    key: 'point_first',
    label: '두괄식',
    description: '결론을 먼저 제시한 뒤 근거를 뒷받침하는 구조. 비즈니스 문서, 보고서에 적합합니다.',
    structureSteps: ['결론 제시', '근거 1', '근거 2', '마무리'],
    practical: true,
  },
  {
    key: 'inverted_pyramid',
    label: '역피라미드',
    description: '가장 중요한 정보부터 순서대로 배치하는 구조. 보도자료, 뉴스 기사에 적합합니다.',
    structureSteps: ['핵심 정보(누가·언제·어디서·무엇을)', '세부 정보', '배경 설명'],
    practical: true,
  },
  {
    key: 'prep',
    label: 'PREP',
    description: 'Point-Reason-Example-Point. 주장을 명확히 각인시키는 설득형 구조입니다.',
    structureSteps: ['핵심 결론(Point)', '이유 및 근거(Reason)', '구체적 사례(Example)', '결론 재강조(Point)'],
    practical: true,
  },
  {
    key: 'gi_seung_jeon_gyeol',
    label: '기승전결',
    description: '기(起)-승(承)-전(轉)-결(結). 이야기에 반전과 여운을 담는 전통적 4단 구조입니다.',
    structureSteps: ['기(起): 도입', '승(承): 전개', '전(轉): 반전', '결(結): 마무리'],
    practical: false,
  },
  {
    key: 'novel_five_act',
    label: '소설 5단 구성',
    description: '발단-전개-위기-절정-결말. 소설, 시나리오 등 서사가 있는 긴 글에 적합합니다.',
    structureSteps: ['발단', '전개', '위기', '절정', '결말'],
    practical: false,
  },
  {
    key: 'heros_journey',
    label: '영웅의 여정',
    description: '평범한 일상에서 모험을 떠나 시련을 겪고 변화해 돌아오는 구조. 성장 서사에 적합합니다.',
    structureSteps: ['평범한 일상', '모험의 부름', '시련과 변화', '귀환'],
    practical: false,
  },
  {
    key: 'parallel',
    label: '병렬식',
    description: '여러 소주제를 대등하게 나열하며 전개하는 구조. 여러 사례나 관점을 다룰 때 적합합니다.',
    structureSteps: ['소주제 1', '소주제 2', '소주제 3'],
    practical: false,
  },
  {
    key: 'spacetime_flow',
    label: '시공간 흐름',
    description: '시간이나 공간의 이동에 따라 전개하는 구조. 기행문, 여행기에 적합합니다.',
    structureSteps: ['첫 번째 시점/장소', '두 번째 시점/장소', '세 번째 시점/장소'],
    practical: false,
  },
]

export function findDevelopmentStructure(key: string) {
  return DEVELOPMENT_STRUCTURES.find((structure) => structure.key === key)
}
