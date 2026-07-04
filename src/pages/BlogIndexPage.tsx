import { Link } from 'react-router-dom'
import { blogPosts } from '@/content/blog/posts'

export function BlogIndexPage() {
  return (
    <div className="min-h-svh bg-paper">
      <header className="border-b border-line bg-white px-6 py-4">
        <Link to="/" className="font-serif text-lg font-semibold text-ink">
          Geullog
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">블로그</h1>
          <p className="mt-1 text-sm text-ink/60">AI 글쓰기를 더 잘 활용하는 방법을 소개합니다.</p>
        </div>

        <div className="flex flex-col gap-4">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="card-link flex flex-col gap-2 p-6"
            >
              <span className="text-xs text-ink/50">{post.date}</span>
              <h2 className="font-semibold text-ink">{post.title}</h2>
              <p className="text-sm text-ink/60">{post.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
