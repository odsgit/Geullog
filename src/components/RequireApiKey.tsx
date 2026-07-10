import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { isAdminEmail } from '@/lib/admin'

// 관리자를 제외한 사용자는 설정 페이지에서 자신의 OpenAI API 키를 입력해야만
// 글쓰기/히스토리/시리즈 등 생성 기능이 걸린 페이지에 들어갈 수 있다.
export function RequireApiKey() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [hasApiKey, setHasApiKey] = useState(false)

  useEffect(() => {
    if (!user) return

    if (isAdminEmail(user.email)) {
      setHasApiKey(true)
      setLoading(false)
      return
    }

    let cancelled = false
    supabase
      .from('profiles')
      .select('openai_api_key')
      .single()
      .then(({ data }) => {
        if (cancelled) return
        setHasApiKey(!!data?.openai_api_key)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  if (loading) return null
  if (!hasApiKey) return <Navigate to="/settings?needKey=1" replace />

  return <Outlet />
}
