import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export function AppHeader() {
  const { user } = useAuth()

  return (
    <header className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
      <div className="flex items-center gap-5">
        <Link to="/" className="text-sm font-semibold text-gray-900">
          Geullog
        </Link>
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
          글쓰기
        </Link>
        <Link to="/history" className="text-sm text-gray-500 hover:text-gray-700">
          히스토리
        </Link>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span>{user?.email}</span>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="rounded-md border border-gray-200 px-3 py-1.5 text-gray-700 transition-colors hover:bg-gray-50"
        >
          로그아웃
        </button>
      </div>
    </header>
  )
}
