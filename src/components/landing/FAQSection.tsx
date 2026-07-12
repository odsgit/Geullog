import { ChevronDown } from 'lucide-react'
import { FAQ_ITEMS } from '@/data/landing'
import { Reveal } from './Reveal'

export function FAQSection() {
  return (
    <section id="faq" className="mx-auto mt-24 w-full max-w-3xl px-4 sm:px-6">
      <Reveal>
        <h2 className="text-center font-serif text-2xl font-semibold text-ink">자주 묻는 질문</h2>
      </Reveal>

      <div className="mt-8 flex flex-col gap-3">
        {FAQ_ITEMS.map((item, index) => (
          <Reveal key={item.question} delay={index * 0.05}>
            <details className="card group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-ink">
                {item.question}
                <ChevronDown className="size-4 shrink-0 text-ink/40 transition-transform motion-safe:duration-200 group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm text-ink/60">{item.answer}</p>
            </details>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
