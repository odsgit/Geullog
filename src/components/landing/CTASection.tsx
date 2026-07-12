import { Link } from 'react-router-dom'
import { Reveal } from './Reveal'

export function CTASection() {
  return (
    <section className="mx-auto mt-24 w-full max-w-3xl px-4 sm:px-6">
      <Reveal>
        <div className="card flex flex-col items-center gap-4 bg-accent/5 p-10 text-center">
          <h2 className="font-serif text-2xl font-semibold text-ink">지금 바로 글쓰기를 시작해보세요</h2>
          <p className="text-sm text-ink/60">가입 없이도 1회 무료 체험으로 AI 글쓰기를 경험할 수 있어요.</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/trial" className="btn-primary">
              무료로 체험하기
            </Link>
            <a href="#signup" className="btn">
              회원가입하고 시작하기
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
