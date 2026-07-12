import { USAGE_STEPS } from '@/data/landing'
import { Reveal } from './Reveal'

// Stands in for a pricing section — Geullog has no paid subscription tiers,
// users bring their own OpenAI API key and pay OpenAI directly for usage.
export function UsageGuide() {
  return (
    <section id="usage" className="mx-auto mt-24 w-full max-w-4xl px-4 sm:px-6">
      <Reveal>
        <div className="text-center">
          <h2 className="font-serif text-2xl font-semibold text-ink">이용 방법 & 비용 안내</h2>
          <p className="mt-2 text-sm text-ink/60">
            Geullog는 별도 구독료 없이, 등록한 OpenAI API 키로 사용한 만큼만 비용이 발생해요.
          </p>
        </div>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {USAGE_STEPS.map((item, index) => (
          <Reveal key={item.step} delay={index * 0.1}>
            <div className="card flex h-full flex-col gap-2 p-6">
              <span className="text-sm font-semibold text-accent">STEP {item.step}</span>
              <h3 className="font-semibold text-ink">{item.title}</h3>
              <p className="text-sm text-ink/60">{item.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
