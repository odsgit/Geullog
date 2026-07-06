export interface DocTypeInfo {
  value: string
  label: string
  purpose: string
  features: string
  developmentStyle: string
  examples: string
  /** 이어쓰기(시리즈)가 자연스러운 장문 문학 유형만 true — 이 경우에만 작가 스타일 선택을 노출한다. */
  longForm: boolean
  /** 일반형(창작/정보 글) vs 실무형(생활/마케팅 글) — 생성 폼에서 종류 선택 전 카테고리 버튼으로 먼저 좁힌다. */
  category: 'general' | 'practical'
  /** 이 글 종류를 고르면 분량 선택에 기본으로 채워지는 추천값 (LENGTH_OPTIONS의 value). */
  recommendedLength: string
}

export const DOC_TYPE_CATEGORIES = [
  { value: 'general', label: '일반형' },
  { value: 'practical', label: '실무형' },
] as const

export const DOC_TYPE_INFO: DocTypeInfo[] = [
  // 일반형
  {
    value: 'exposition',
    label: '설명문',
    purpose: '정보를 이해시키기',
    features: '객관적이고 정확한 설명',
    developmentStyle: '3단 구성, 두괄식',
    examples: '교과서, 백과사전, 사용설명서',
    longForm: false,
    category: 'general',
    recommendedLength: 'long',
  },
  {
    value: 'editorial',
    label: '논설문',
    purpose: '주장과 의견 설득',
    features: '논리적인 근거와 주장 제시',
    developmentStyle: 'PREP, 3단 구성',
    examples: '칼럼, 사설, 시사 글',
    longForm: false,
    category: 'general',
    recommendedLength: 'long',
  },
  {
    value: 'report',
    label: '보고서',
    purpose: '조사·연구 결과 전달',
    features: '체계적인 분석과 결론',
    developmentStyle: '5단 구성, 두괄식',
    examples: '연구보고서, 업무보고서',
    longForm: false,
    category: 'general',
    recommendedLength: 'long',
  },
  {
    value: 'news_article',
    label: '기사',
    purpose: '사실과 사건 전달',
    features: '객관성, 신속성, 핵심 우선',
    developmentStyle: '역피라미드',
    examples: '신문 기사, 인터넷 뉴스',
    longForm: false,
    category: 'general',
    recommendedLength: 'long',
  },
  {
    value: 'column',
    label: '칼럼',
    purpose: '특정 주제에 대한 개인적 견해와 통찰 전달',
    features: '전문성과 개성 있는 시각, 논거 제시',
    developmentStyle: 'PREP, 두괄식',
    examples: '신문 칼럼, 전문가 기고',
    longForm: false,
    category: 'general',
    recommendedLength: 'detailed',
  },
  {
    value: 'technical_doc',
    label: '기술 문서',
    purpose: '기술·제품의 작동 방식과 사용법 전달',
    features: '정확성과 단계별 설명, 전문 용어 정의',
    developmentStyle: '두괄식, 5단 구성',
    examples: 'API 문서, 매뉴얼, 개발 가이드',
    longForm: false,
    category: 'general',
    recommendedLength: 'long',
  },
  {
    value: 'essay',
    label: '수필 (에세이)',
    purpose: '경험과 감상 표현',
    features: '자유로운 형식, 감성 중심',
    developmentStyle: '기승전결, 시간 흐름',
    examples: '에세이, 독후감',
    longForm: true,
    category: 'general',
    recommendedLength: 'detailed',
  },
  {
    value: 'novel',
    label: '소설',
    purpose: '이야기와 메시지 전달',
    features: '인물, 사건, 갈등 중심',
    developmentStyle: '소설 5단 구성, 영웅의 여정',
    examples: '장편소설, 웹소설',
    longForm: true,
    category: 'general',
    recommendedLength: 'very_long',
  },
  {
    value: 'poem',
    label: '시',
    purpose: '감정과 정서 표현',
    features: '함축적이고 운율 있는 표현',
    developmentStyle: '자유 구성',
    examples: '자유시, 서정시',
    longForm: false,
    category: 'general',
    recommendedLength: 'short',
  },
  {
    value: 'play',
    label: '희곡',
    purpose: '연극 공연을 위한 글',
    features: '대사와 행동 중심',
    developmentStyle: '3막 구조, 5막 구조',
    examples: '연극, 뮤지컬 대본',
    longForm: true,
    category: 'general',
    recommendedLength: 'very_long',
  },
  {
    value: 'screenplay',
    label: '시나리오',
    purpose: '영상 제작을 위한 글',
    features: '장면과 대사 중심',
    developmentStyle: '3막 구조',
    examples: '영화, 드라마 대본',
    longForm: true,
    category: 'general',
    recommendedLength: 'very_long',
  },
  {
    value: 'travelogue',
    label: '기행문',
    purpose: '여행 경험 기록',
    features: '시간과 공간의 흐름 중심',
    developmentStyle: '시·공간 흐름',
    examples: '여행기, 답사기',
    longForm: true,
    category: 'general',
    recommendedLength: 'long',
  },
  {
    value: 'critique',
    label: '평론',
    purpose: '작품이나 사회 현상 분석',
    features: '객관적 분석과 평가',
    developmentStyle: 'PREP, 3단 구성',
    examples: '영화 평론, 문학 평론',
    longForm: false,
    category: 'general',
    recommendedLength: 'long',
  },
  {
    value: 'speech',
    label: '연설문',
    purpose: '청중에게 메시지 전달',
    features: '호소력과 설득력 강조',
    developmentStyle: 'PREP, 두괄식',
    examples: '축사, 기념사',
    longForm: false,
    category: 'general',
    recommendedLength: 'long',
  },
  {
    value: 'blog',
    label: '블로그 글',
    purpose: '정보 공유 및 소통',
    features: '가독성과 친근함',
    developmentStyle: '두괄식, 병렬식, PREP',
    examples: '정보성 글, 리뷰, 튜토리얼',
    longForm: false,
    category: 'general',
    recommendedLength: 'detailed',
  },

  // 실무형
  {
    value: 'proposal',
    label: '제안서',
    purpose: '아이디어와 계획 제안',
    features: '문제 해결과 기대 효과 제시',
    developmentStyle: 'PREP, 두괄식',
    examples: '사업 제안서, 기획서',
    longForm: false,
    category: 'practical',
    recommendedLength: 'long',
  },
  {
    value: 'diary',
    label: '일기',
    purpose: '일상과 감정 기록',
    features: '개인 경험과 생각 표현',
    developmentStyle: '시간 순서',
    examples: '일기장, 학습일지',
    longForm: false,
    category: 'practical',
    recommendedLength: 'medium',
  },
  {
    value: 'letter',
    label: '편지',
    purpose: '특정 대상과 소통',
    features: '수신자를 고려한 표현',
    developmentStyle: '자유 구성',
    examples: '감사 편지, 초청장',
    longForm: false,
    category: 'practical',
    recommendedLength: 'medium',
  },
  {
    value: 'email',
    label: '이메일',
    purpose: '업무 및 일상 소통',
    features: '간결하고 목적 중심',
    developmentStyle: '두괄식',
    examples: '업무 메일, 안내 메일',
    longForm: false,
    category: 'practical',
    recommendedLength: 'short',
  },
  {
    value: 'self_intro',
    label: '자기소개서',
    purpose: '자신의 역량 소개',
    features: '경험과 강점 중심',
    developmentStyle: 'STAR, PREP',
    examples: '입사지원서, 대학 지원서',
    longForm: false,
    category: 'practical',
    recommendedLength: 'medium',
  },
  {
    value: 'one_line_intro',
    label: '한줄 소개',
    purpose: '자신·서비스를 한 문장으로 압축 소개',
    features: '핵심만 간결하게, 기억하기 쉬운 표현',
    developmentStyle: '자유 구성',
    examples: 'SNS 프로필 소개, 명함 문구',
    longForm: false,
    category: 'practical',
    recommendedLength: 'ultra_short',
  },
  {
    value: 'notice',
    label: '공지사항',
    purpose: '필요한 정보를 명확히 전달',
    features: '육하원칙, 간결하고 정확한 안내',
    developmentStyle: '두괄식',
    examples: '학교·회사 공지, 안내문',
    longForm: false,
    category: 'practical',
    recommendedLength: 'short',
  },
  {
    value: 'sns_post',
    label: 'SNS 게시글',
    purpose: '짧은 소통과 공감 유도',
    features: '친근한 어조, 해시태그·이모지 활용 가능',
    developmentStyle: '자유 구성',
    examples: '인스타그램, 페이스북, 트위터 게시글',
    longForm: false,
    category: 'practical',
    recommendedLength: 'short',
  },
  {
    value: 'product_intro',
    label: '제품·서비스 소개',
    purpose: '제품·서비스의 특징과 장점 전달',
    features: '기능과 혜택 중심, 신뢰감 있는 설명',
    developmentStyle: '두괄식, PREP',
    examples: '상세페이지, 서비스 소개서',
    longForm: false,
    category: 'practical',
    recommendedLength: 'medium',
  },
  {
    value: 'slogan',
    label: '표어',
    purpose: '메시지를 각인시키는 짧은 문구',
    features: '운율감, 강렬하고 기억하기 쉬운 표현',
    developmentStyle: '자유 구성',
    examples: '표어, 캠페인 문구',
    longForm: false,
    category: 'practical',
    recommendedLength: 'ultra_short',
  },
  {
    value: 'book_report',
    label: '독후감',
    purpose: '책을 읽은 후 느낌 기록',
    features: '줄거리와 느낀 점 정리',
    developmentStyle: '기승전결',
    examples: '독서 감상문',
    longForm: false,
    category: 'practical',
    recommendedLength: 'medium',
  },
  {
    value: 'impression',
    label: '감상문',
    purpose: '작품에 대한 느낌 표현',
    features: '개인의 생각과 감상 중심',
    developmentStyle: '기승전결',
    examples: '독후감, 영화 감상문',
    longForm: false,
    category: 'practical',
    recommendedLength: 'medium',
  },
  {
    value: 'one_line_slogan',
    label: '한줄슬로건',
    purpose: '브랜드·캠페인 메시지를 한 줄로 압축',
    features: '강렬하고 간결한 표현, 반복 가능한 리듬',
    developmentStyle: '자유 구성',
    examples: '브랜드 슬로건, 캠페인 슬로건',
    longForm: false,
    category: 'practical',
    recommendedLength: 'ultra_short',
  },
  {
    value: 'short_copy',
    label: '짧은카피',
    purpose: '짧은 문구로 관심을 끌기',
    features: '임팩트 있는 한두 문장',
    developmentStyle: '자유 구성',
    examples: '배너 문구, 팝업 카피',
    longForm: false,
    category: 'practical',
    recommendedLength: 'ultra_short',
  },
  {
    value: 'main_headline',
    label: '메인 헤드라인',
    purpose: '시선을 사로잡는 대표 문구',
    features: '강렬한 첫인상, 핵심 메시지 압축',
    developmentStyle: '자유 구성',
    examples: '랜딩페이지 메인 문구, 광고 헤드라인',
    longForm: false,
    category: 'practical',
    recommendedLength: 'ultra_short',
  },
  {
    value: 'sub_copy',
    label: '서브카피',
    purpose: '헤드라인을 보완하는 설명',
    features: '헤드라인보다 구체적인 부연 설명',
    developmentStyle: '자유 구성',
    examples: '랜딩페이지 서브 문구, 상세 설명 카피',
    longForm: false,
    category: 'practical',
    recommendedLength: 'ultra_short',
  },
  {
    value: 'ad_copy',
    label: '광고카피',
    purpose: '구매·행동을 유도하는 설득',
    features: '감성 자극과 행동 유도 문구(CTA)',
    developmentStyle: 'PREP, 자유 구성',
    examples: '광고 문구, 프로모션 카피',
    longForm: false,
    category: 'practical',
    recommendedLength: 'short',
  },
  {
    value: 'product_copy',
    label: '제품소개카피',
    purpose: '제품의 매력을 짧고 인상적으로 전달',
    features: '핵심 셀링포인트 압축, 감각적 표현',
    developmentStyle: '자유 구성',
    examples: '제품 상세페이지 카피, 패키지 문구',
    longForm: false,
    category: 'practical',
    recommendedLength: 'short',
  },
  {
    value: 'brand_story',
    label: '브랜드스토리',
    purpose: '브랜드의 철학과 이야기로 공감 형성',
    features: '서사적 구성, 진정성 있는 스토리텔링',
    developmentStyle: '기승전결',
    examples: '브랜드 소개 페이지, 회사 연혁 스토리',
    longForm: false,
    category: 'practical',
    recommendedLength: 'detailed',
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

export interface LengthOption {
  value: string
  label: string
  charRange: string
  recommendedFor: string
}

export const LENGTH_OPTIONS: LengthOption[] = [
  { value: 'ultra_short', label: '초간결', charRange: '5~30자', recommendedFor: '슬로건, 표어' },
  { value: 'short', label: '짧게', charRange: '100~500자', recommendedFor: '공지, SNS' },
  { value: 'medium', label: '보통', charRange: '500~1,000자', recommendedFor: '후기, 자기소개' },
  { value: 'detailed', label: '자세하게', charRange: '1,000~2,000자', recommendedFor: '블로그, 칼럼' },
  { value: 'long', label: '길게', charRange: '2,000~5,000자', recommendedFor: '심층 콘텐츠, 보고서' },
  { value: 'very_long', label: '매우 길게', charRange: '5,000자 이상', recommendedFor: '소설, 전자책' },
]

export function findLengthOption(value: string) {
  return LENGTH_OPTIONS.find((option) => option.value === value)
}
