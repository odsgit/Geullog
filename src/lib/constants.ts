export interface DocTypeInfo {
  value: string
  label: string
  purpose: string
  features: string
  developmentStyle: string
  examples: string
  /** 이어쓰기(시리즈)가 자연스러운 장문 문학 유형만 true — 이 경우에만 작가 스타일 선택을 노출한다. */
  longForm: boolean
}

export const DOC_TYPE_INFO: DocTypeInfo[] = [
  {
    value: 'exposition',
    label: '설명문',
    purpose: '정보를 이해시키기',
    features: '객관적이고 정확한 설명',
    developmentStyle: '3단 구성, 두괄식',
    examples: '교과서, 백과사전, 사용설명서',
    longForm: false,
  },
  {
    value: 'editorial',
    label: '논설문',
    purpose: '주장과 의견 설득',
    features: '논리적인 근거와 주장 제시',
    developmentStyle: 'PREP, 3단 구성',
    examples: '칼럼, 사설, 시사 글',
    longForm: false,
  },
  {
    value: 'report',
    label: '보고서',
    purpose: '조사·연구 결과 전달',
    features: '체계적인 분석과 결론',
    developmentStyle: '5단 구성, 두괄식',
    examples: '연구보고서, 업무보고서',
    longForm: false,
  },
  {
    value: 'proposal',
    label: '제안서',
    purpose: '아이디어와 계획 제안',
    features: '문제 해결과 기대 효과 제시',
    developmentStyle: 'PREP, 두괄식',
    examples: '사업 제안서, 기획서',
    longForm: false,
  },
  {
    value: 'news_article',
    label: '기사',
    purpose: '사실과 사건 전달',
    features: '객관성, 신속성, 핵심 우선',
    developmentStyle: '역피라미드',
    examples: '신문 기사, 인터넷 뉴스',
    longForm: false,
  },
  {
    value: 'essay',
    label: '수필 (에세이)',
    purpose: '경험과 감상 표현',
    features: '자유로운 형식, 감성 중심',
    developmentStyle: '기승전결, 시간 흐름',
    examples: '에세이, 독후감',
    longForm: true,
  },
  {
    value: 'novel',
    label: '소설',
    purpose: '이야기와 메시지 전달',
    features: '인물, 사건, 갈등 중심',
    developmentStyle: '소설 5단 구성, 영웅의 여정',
    examples: '장편소설, 웹소설',
    longForm: true,
  },
  {
    value: 'poem',
    label: '시',
    purpose: '감정과 정서 표현',
    features: '함축적이고 운율 있는 표현',
    developmentStyle: '자유 구성',
    examples: '자유시, 서정시',
    longForm: false,
  },
  {
    value: 'play',
    label: '희곡',
    purpose: '연극 공연을 위한 글',
    features: '대사와 행동 중심',
    developmentStyle: '3막 구조, 5막 구조',
    examples: '연극, 뮤지컬 대본',
    longForm: true,
  },
  {
    value: 'screenplay',
    label: '시나리오',
    purpose: '영상 제작을 위한 글',
    features: '장면과 대사 중심',
    developmentStyle: '3막 구조',
    examples: '영화, 드라마 대본',
    longForm: true,
  },
  {
    value: 'travelogue',
    label: '기행문',
    purpose: '여행 경험 기록',
    features: '시간과 공간의 흐름 중심',
    developmentStyle: '시·공간 흐름',
    examples: '여행기, 답사기',
    longForm: true,
  },
  {
    value: 'diary',
    label: '일기',
    purpose: '일상과 감정 기록',
    features: '개인 경험과 생각 표현',
    developmentStyle: '시간 순서',
    examples: '일기장, 학습일지',
    longForm: false,
  },
  {
    value: 'letter',
    label: '편지',
    purpose: '특정 대상과 소통',
    features: '수신자를 고려한 표현',
    developmentStyle: '자유 구성',
    examples: '감사 편지, 초청장',
    longForm: false,
  },
  {
    value: 'email',
    label: '이메일',
    purpose: '업무 및 일상 소통',
    features: '간결하고 목적 중심',
    developmentStyle: '두괄식',
    examples: '업무 메일, 안내 메일',
    longForm: false,
  },
  {
    value: 'critique',
    label: '평론',
    purpose: '작품이나 사회 현상 분석',
    features: '객관적 분석과 평가',
    developmentStyle: 'PREP, 3단 구성',
    examples: '영화 평론, 문학 평론',
    longForm: false,
  },
  {
    value: 'impression',
    label: '감상문',
    purpose: '작품에 대한 느낌 표현',
    features: '개인의 생각과 감상 중심',
    developmentStyle: '기승전결',
    examples: '독후감, 영화 감상문',
    longForm: false,
  },
  {
    value: 'book_report',
    label: '독후감',
    purpose: '책을 읽은 후 느낌 기록',
    features: '줄거리와 느낀 점 정리',
    developmentStyle: '기승전결',
    examples: '독서 감상문',
    longForm: false,
  },
  {
    value: 'self_intro',
    label: '자기소개서',
    purpose: '자신의 역량 소개',
    features: '경험과 강점 중심',
    developmentStyle: 'STAR, PREP',
    examples: '입사지원서, 대학 지원서',
    longForm: false,
  },
  {
    value: 'speech',
    label: '연설문',
    purpose: '청중에게 메시지 전달',
    features: '호소력과 설득력 강조',
    developmentStyle: 'PREP, 두괄식',
    examples: '축사, 기념사',
    longForm: false,
  },
  {
    value: 'blog',
    label: '블로그 글',
    purpose: '정보 공유 및 소통',
    features: '가독성과 친근함',
    developmentStyle: '두괄식, 병렬식, PREP',
    examples: '정보성 글, 리뷰, 튜토리얼',
    longForm: false,
  },
]

export function findDocTypeInfo(value: string) {
  return DOC_TYPE_INFO.find((info) => info.value === value)
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
