import { Link } from 'react-router-dom'
import { FOOTER_LINKS } from '@/data/landing'

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:flex-row sm:justify-between sm:px-6">
        <div>
          <span className="font-serif text-lg font-semibold text-ink">Geullog</span>
          <p className="mt-2 max-w-xs text-sm text-ink/50">AI가 완성하는 나만의 글쓰기.</p>
        </div>

        <div className="flex gap-12">
          {FOOTER_LINKS.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold text-ink">{group.title}</h3>
              <ul className="mt-3 flex flex-col gap-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-sm text-ink/60 hover:text-ink">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-line px-4 py-4 text-center text-xs text-ink/40 sm:px-6">
        © {new Date().getFullYear()} Geullog. All rights reserved.
      </div>
    </footer>
  )
}
