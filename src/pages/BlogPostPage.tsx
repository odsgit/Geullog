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
    <div className="min-h-svh bg-gray-50">
      <header className="border-b border-gray-100 bg-white px-6 py-4">
        <Link to="/" className="text-sm font-semibold text-gray-900">
          Geullog
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
        <Link to="/blog" className="text-sm text-gray-500 hover:text-gray-700">
          ← 블로그로 돌아가기
        </Link>

        {(notFound || !meta) && (
          <p className="text-sm text-gray-500">존재하지 않는 글이에요.</p>
        )}

        {meta && (
          <article className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <span className="text-xs text-gray-400">{meta.date}</span>
            <h1 className="mt-1 text-xl font-semibold text-gray-900">{meta.title}</h1>

            <div className="prose prose-sm prose-gray mt-6 max-w-none">
              {Content && <Content />}
            </div>

            <Link
              to="/trial"
              className="mt-8 block w-full rounded-lg bg-gray-900 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-gray-700"
            >
              지금 AI로 직접 써보기
            </Link>
          </article>
        )}
      </main>
    </div>
  )
}
