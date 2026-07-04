import { useEffect, useState, type ComponentType } from 'react'
import { Link, useParams } from 'react-router-dom'
import { blogPosts } from '@/content/blog/posts'

const postModules = import.meta.glob<{ default: ComponentType }>('/src/content/blog/*.mdx')

export function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [Content, setContent] = useState<ComponentType | null>(null)
  const [notFound, setNotFound] = useState(false)

  const meta = blogPosts.find((post) => post.slug === slug)

  useEffect(() => {
    if (!slug) return

    const loader = postModules[`/src/content/blog/${slug}.mdx`]
    if (!loader) {
      setNotFound(true)
      return
    }

    loader().then((mod) => setContent(() => mod.default))
  }, [slug])

  return (
    <div className="min-h-svh bg-paper">
      <header className="border-b border-line bg-white px-6 py-4">
        <Link to="/" className="font-serif text-lg font-semibold text-ink">
          Geullog
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
        <Link to="/blog" className="text-sm text-ink/60 hover:text-ink">
          ← 블로그로 돌아가기
        </Link>

        {(notFound || !meta) && <p className="text-sm text-ink/60">존재하지 않는 글이에요.</p>}

        {meta && (
          <article className="card p-8">
            <span className="text-xs text-ink/50">{meta.date}</span>
            <h1 className="mt-1 font-serif text-2xl font-semibold text-ink">{meta.title}</h1>

            <div className="prose prose-sm mt-6 max-w-none prose-headings:font-serif prose-headings:font-semibold prose-headings:text-ink prose-a:text-accent prose-a:underline prose-strong:text-ink">
              {Content && <Content />}
            </div>

            <Link to="/trial" className="btn-primary mt-8 w-full">
              지금 AI로 직접 써보기
            </Link>
          </article>
        )}
      </main>
    </div>
  )
}
