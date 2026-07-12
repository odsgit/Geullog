import { DOC_TYPE_INFO } from '@/lib/constants'

const labels = DOC_TYPE_INFO.map((docType) => docType.label)
const loop = [...labels, ...labels]

export function SocialProofMarquee() {
  return (
    <section className="border-y border-line bg-white py-6" aria-label="지원하는 글 형식 목록">
      <p className="text-center text-xs font-semibold tracking-wide text-ink/40 uppercase">
        30여 종의 글 형식을 지원해요
      </p>
      <div className="relative mt-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max gap-3 motion-safe:animate-marquee">
          {loop.map((label, index) => (
            <span key={`${label}-${index}`} className="badge shrink-0" aria-hidden={index >= labels.length}>
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
