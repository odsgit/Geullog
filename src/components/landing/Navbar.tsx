import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { NAV_LINKS } from '@/data/landing'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b transition-colors',
        scrolled ? 'border-line bg-paper/80 backdrop-blur-md' : 'border-transparent bg-transparent',
      )}
    >
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
        <a href="#top" className="font-serif text-lg font-semibold text-ink">
          Geullog
        </a>

        <div className="hidden items-center gap-6 sm:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-ink/60 hover:text-ink">
              {link.label}
            </a>
          ))}
          <a href="#signup" className="btn-sm">
            무료로 시작하기
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="sm:hidden"
          aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={open}
        >
          {open ? <X className="size-6 text-ink" /> : <Menu className="size-6 text-ink" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-paper px-4 pb-4 sm:hidden">
          <div className="flex flex-col gap-3 pt-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-ink/70"
              >
                {link.label}
              </a>
            ))}
            <a href="#signup" onClick={() => setOpen(false)} className="btn-primary text-center">
              무료로 시작하기
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
