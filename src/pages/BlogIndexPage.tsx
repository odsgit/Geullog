import { Link } from 'react-router-dom'
import { blogPosts } from '@/content/blog/posts'

export function BlogIndexPage() {
  return (
    <div className="min-h-svh bg-paper">
      <header className="border-b-[3px] border-black bg-white px-6 py-4">
        <Link to="/" className="text-lg font-black text-black">
          Geullog
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
        <div>
          <h1 className="text-2xl font-black text-black">블로그</h1>
          <p className="mt-1 text-sm font-medium text-black/60">
            AI 글쓰기를 더 잘 활용하는 방법을 소개합니다.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="brutal-card-link flex flex-col gap-2 p-6"
            >
              <span className="text-xs font-bold text-black/50">{post.date}</span>
              <h2 className="font-bold text-black">{post.title}</h2>
              <p className="text-sm font-medium text-black/60">{post.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
