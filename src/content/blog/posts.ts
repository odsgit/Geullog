export interface BlogPostMeta {
  slug: string
  title: string
  description: string
  date: string
}

// Ordered newest-first; both the blog index and functions/blog/[slug].ts
// (server-side SEO meta injection) read this manifest.
export const blogPosts: BlogPostMeta[] = [
  {
    slug: 'geullog-v2-devlog',
    title: 'Geullog v2.0 개발기: 새 기능보다 고치는 데 더 많은 시간을 쓴 버전',
    description:
      '시작하자마자 멈춘 마이그레이션부터 버전 되돌리기가 숨어있던 자리, 폼 간소화, 글 종류 재설계, 이어쓰기 개선까지 — v2.0 개발 기록.',
    date: '2026-07-06',
  },
  {
    slug: 'sns-caption-tips',
    title: 'SNS 캡션 잘 쓰는 팁 5가지',
    description:
      '인스타그램, 트위터에서 반응이 좋은 SNS 캡션은 어떻게 다를까요? 짧지만 임팩트 있는 캡션을 쓰는 실전 팁을 정리했습니다.',
    date: '2026-07-04',
  },
  {
    slug: 'ai-product-description-writing',
    title: 'AI로 상품 설명 쓰는 법',
    description:
      '온라인 쇼핑몰 상품 설명, 매번 쓰기 막막하셨나요? AI를 활용해 매력적인 상품 설명을 빠르게 완성하는 방법을 소개합니다.',
    date: '2026-07-04',
  },
]
