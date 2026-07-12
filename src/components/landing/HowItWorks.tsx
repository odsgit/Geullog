import { HOW_IT_WORKS_STEPS } from '@/data/landing'
import { Reveal } from './Reveal'

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto mt-24 w-full max-w-4xl px-4 sm:px-6">
      <Reveal>
        <h2 className="text-center font-serif text-2xl font-semibold text-ink">이렇게 글이 완성돼요</h2>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {HOW_IT_WORKS_STEPS.map((item, index) => (
          <Reveal key={item.step} delay={index * 0.08}>
            <div className="flex h-full flex-col gap-2">
              <span className="badge-accent w-fit">STEP {item.step}</span>
              <h3 className="font-semibold text-ink">{item.title}</h3>
              <p className="text-sm text-ink/60">{item.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
