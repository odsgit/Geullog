export interface NavLink {
  label: string
  href: string
}

export const NAV_LINKS: NavLink[] = [
  { label: '기능', href: '#features' },
  { label: '이용 방법', href: '#how-it-works' },
  { label: '요금 안내', href: '#usage' },
  { label: '자주 묻는 질문', href: '#faq' },
]

export interface FeatureHighlight {
  icon: string
  title: string
  description: string
}

export const FEATURE_HIGHLIGHTS: FeatureHighlight[] = [
  {
    icon: '🖋️',
    title: '다양한 글 형식',
    description: '블로그, 상품 설명, SNS 캡션, 이메일, 자기소개서, 보도자료까지 원하는 형식으로',
  },
  {
    icon: '📷',
    title: '사진으로 글쓰기',
    description: '사진 한 장만 올리면 AI가 내용을 분석해 글에 자연스럽게 반영해요',
  },
  {
    icon: '🔄',
    title: '재생성 & 톤 조정',
    description: '마음에 안 들면 다시 생성하거나 더 캐주얼하게, 더 격식있게 바꿔보세요',
  },
  {
    icon: '📝',
    title: '편집 & 내보내기',
    description: '리치 텍스트 에디터로 바로 다듬고, .txt·.docx 파일로 내보낼 수 있어요',
  },
  {
    icon: '🕘',
    title: '히스토리 저장',
    description: '지금까지 만든 글을 언제든 다시 불러와 이어서 편집할 수 있어요',
  },
  {
    icon: '🔗',
    title: '공유 & 템플릿 갤러리',
    description: '완성한 글은 링크로 공유하고, 다른 사람이 만든 템플릿으로 바로 시작해보세요',
  },
]

export interface ProcessStep {
  step: number
  title: string
  description: string
}

export const HOW_IT_WORKS_STEPS: ProcessStep[] = [
  {
    step: 1,
    title: '글 종류 선택',
    description: '블로그, 상품 소개, 자기소개서, 소설까지 30여 종의 글 형식 중 원하는 걸 고르세요.',
  },
  {
    step: 2,
    title: '주제 입력',
    description: '한 줄 주제만 알려주세요. 사진을 첨부하면 AI가 내용을 분석해 글에 반영해요.',
  },
  {
    step: 3,
    title: 'AI 초안 생성',
    description: '문체, 분량, 전개 방식을 선택하면 AI가 몇 초 만에 초안을 완성해요.',
  },
  {
    step: 4,
    title: '편집 & 내보내기',
    description: '리치 텍스트 에디터로 다듬고 .txt·.docx 파일로 바로 내보낼 수 있어요.',
  },
]

export const USAGE_STEPS: ProcessStep[] = [
  {
    step: 1,
    title: '무료로 가입하기',
    description: '이메일이나 Google 계정으로 몇 초 만에 가입할 수 있어요.',
  },
  {
    step: 2,
    title: '가입 없이 먼저 체험',
    description: '회원가입 전에도 1회 무료 체험으로 AI 글쓰기를 바로 경험해볼 수 있어요.',
  },
  {
    step: 3,
    title: '본인 API 키 등록',
    description:
      'Geullog는 별도 구독료가 없어요. 본인의 OpenAI API 키를 등록하면 실제 사용한 만큼만 비용이 발생해요.',
  },
]

export interface FaqItem {
  question: string
  answer: string
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'API 키가 없어도 써볼 수 있나요?',
    answer: '네. 가입 없이도 1회 무료 체험이 가능해요. 이후 계속 쓰려면 본인의 OpenAI API 키를 등록해야 해요.',
  },
  {
    question: 'Geullog 이용료는 얼마인가요?',
    answer: 'Geullog 자체 구독료는 없어요. 등록한 OpenAI API 키로 실제 사용한 만큼만 OpenAI에 비용이 청구돼요.',
  },
  {
    question: 'API 키는 안전하게 보관되나요?',
    answer: '네, 입력한 키는 안전하게 저장되며 본인 계정의 글쓰기 요청에만 사용돼요.',
  },
  {
    question: '어떤 종류의 글을 쓸 수 있나요?',
    answer: '블로그, 보고서, 자기소개서 같은 실무형 글부터 소설, 시나리오 같은 창작 글까지 30여 종을 지원해요.',
  },
  {
    question: '생성한 글은 어떻게 활용하나요?',
    answer: '리치 텍스트 에디터로 바로 다듬고, .txt·.docx로 내보내거나 링크로 공유할 수 있어요.',
  },
]

export interface FooterLinkGroup {
  title: string
  links: { label: string; href: string }[]
}

export const FOOTER_LINKS: FooterLinkGroup[] = [
  {
    title: '제품',
    links: [
      { label: '무료 체험', href: '/trial' },
      { label: '템플릿 갤러리', href: '/templates' },
      { label: '블로그', href: '/blog' },
    ],
  },
  {
    title: '계정',
    links: [
      { label: '로그인', href: '/login' },
      { label: '설정', href: '/settings' },
    ],
  },
]
