import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

type Mode = 'signIn' | 'signUp'

export function LoginPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setMessage(null)
    setSubmitting(true)

    const { error } =
      mode === 'signIn'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    if (mode === 'signIn') {
      navigate('/', { replace: true })
    } else {
      setMessage('가입 확인 메일을 보냈습니다. 메일함을 확인해주세요.')
    }
  }

  async function handleGoogleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  }

  return (
    <div>
      <h1>{mode === 'signIn' ? '로그인' : '회원가입'}</h1>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="이메일"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
          placeholder="비밀번호"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <button type="submit" disabled={submitting}>
          {mode === 'signIn' ? '로그인' : '회원가입'}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}
      {message && <p>{message}</p>}

      <button type="button" onClick={handleGoogleSignIn}>
        Google로 계속하기
      </button>

      <button type="button" onClick={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}>
        {mode === 'signIn' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
      </button>
    </div>
  )
}
