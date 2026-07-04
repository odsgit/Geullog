const features = [
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

export function FeatureHighlights() {
  return (
    <section className="mx-auto mt-16 w-full max-w-4xl">
      <h2 className="text-center font-serif text-2xl font-semibold text-ink">
        Geullog로 할 수 있는 것들
      </h2>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="card flex flex-col gap-2 p-6">
            <span className="text-2xl">{feature.icon}</span>
            <h3 className="font-semibold text-ink">{feature.title}</h3>
            <p className="text-sm text-ink/60">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
