import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { GenerationForm } from '@/components/GenerationForm'

export function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-svh bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
        <span className="text-sm font-semibold text-gray-900">Geullog</span>
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

      <main className="px-6 py-12">
        <GenerationForm />
      </main>
    </div>
  )
}
