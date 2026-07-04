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
      <header className="border-b-[3px] border-black bg-white px-6 py-4">
        <Link to="/" className="text-lg font-black text-black">
          Geullog
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
        <Link to="/blog" className="text-sm font-bold text-black/60 hover:text-black">
          ← 블로그로 돌아가기
        </Link>

        {(notFound || !meta) && <p className="text-sm font-bold text-black/60">존재하지 않는 글이에요.</p>}

        {meta && (
          <article className="brutal-card p-8">
            <span className="text-xs font-bold text-black/50">{meta.date}</span>
            <h1 className="mt-1 text-2xl font-black text-black">{meta.title}</h1>

            <div className="prose prose-sm mt-6 max-w-none prose-headings:font-black prose-headings:text-black prose-a:text-black prose-a:underline prose-a:decoration-2 prose-strong:text-black">
              {Content && <Content />}
            </div>

            <Link to="/trial" className="brutal-btn-primary mt-8 w-full">
              지금 AI로 직접 써보기
            </Link>
          </article>
        )}
      </main>
    </div>
  )
}
