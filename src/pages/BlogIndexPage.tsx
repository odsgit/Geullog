import { Link } from 'react-router-dom'
import { blogPosts } from '@/content/blog/posts'

export function BlogIndexPage() {
  return (
    <div className="min-h-svh bg-gray-50">
      <header className="border-b border-gray-100 bg-white px-6 py-4">
        <Link to="/" className="text-sm font-semibold text-gray-900">
          Geullog
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">블로그</h1>
          <p className="mt-1 text-sm text-gray-500">AI 글쓰기를 더 잘 활용하는 방법을 소개합니다.</p>
        </div>

        <div className="flex flex-col gap-4">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="flex flex-col gap-2 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-colors hover:border-gray-200"
            >
              <span className="text-xs text-gray-400">{post.date}</span>
              <h2 className="font-medium text-gray-900">{post.title}</h2>
              <p className="text-sm text-gray-500">{post.description}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
