import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const REFERRAL_STORAGE_KEY = 'geullog_referral_code'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Captured before ProtectedRoute can redirect away and drop the query string.
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref && !localStorage.getItem(REFERRAL_STORAGE_KEY)) {
      localStorage.setItem(REFERRAL_STORAGE_KEY, ref)
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    const referralCode = localStorage.getItem(REFERRAL_STORAGE_KEY)
    if (!referralCode) return

    Promise.resolve(supabase.rpc('apply_referral', { p_referral_code: referralCode })).finally(
      () => {
        localStorage.removeItem(REFERRAL_STORAGE_KEY)
      },
    )
  }, [session])

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
