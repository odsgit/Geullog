import { FEATURE_HIGHLIGHTS } from '@/data/landing'
import { Reveal } from '@/components/landing/Reveal'

export function FeatureHighlights() {
  return (
    <section id="features" className="mx-auto mt-24 w-full max-w-4xl px-4 sm:px-6">
      <Reveal>
        <h2 className="text-center font-serif text-2xl font-semibold text-ink">
          Geullog로 할 수 있는 것들
        </h2>
      </Reveal>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURE_HIGHLIGHTS.map((feature, index) => (
          <Reveal key={feature.title} delay={index * 0.08}>
            <div className="card flex h-full flex-col gap-2 p-6">
              <span className="text-2xl">{feature.icon}</span>
              <h3 className="font-semibold text-ink">{feature.title}</h3>
              <p className="text-sm text-ink/60">{feature.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
