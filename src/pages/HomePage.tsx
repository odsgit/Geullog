import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export function HomePage() {
  const { user } = useAuth()

  return (
    <div>
      <p>{user?.email}님 환영합니다</p>
      <button type="button" onClick={() => supabase.auth.signOut()}>
        로그아웃
      </button>
    </div>
  )
}
