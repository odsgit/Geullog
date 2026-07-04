import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/Input'

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
    <div className="flex min-h-svh items-center justify-center bg-paper px-4">
      <div className="brutal-card w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-black text-black">Geullog</h1>
          <p className="mt-1 text-sm font-medium text-black/60">
            {mode === 'signIn' ? '로그인하고 글쓰기를 시작해보세요' : '몇 초면 가입이 끝나요'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            type="email"
            label="이메일"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            type="password"
            label="비밀번호"
            required
            minLength={6}
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            placeholder="6자 이상"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error && (
            <p role="alert" className="text-sm font-bold text-red-500">
              {error}
            </p>
          )}
          {message && <p className="text-sm font-bold text-black/70">{message}</p>}

          <button type="submit" disabled={submitting} className="brutal-btn-primary w-full">
            {mode === 'signIn' ? '로그인' : '회원가입'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-[3px] flex-1 bg-black" />
          <span className="text-xs font-bold text-black/50">또는</span>
          <div className="h-[3px] flex-1 bg-black" />
        </div>

        <button type="button" onClick={handleGoogleSignIn} className="brutal-btn w-full">
          Google로 계속하기
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
          className="mt-5 w-full text-center text-sm font-bold text-black/60 hover:text-black"
        >
          {mode === 'signIn' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
        </button>

        <Link
          to="/trial"
          className="mt-2 block w-full text-center text-sm font-bold text-black/40 hover:text-black"
        >
          가입 없이 먼저 체험해보기
        </Link>
        <Link
          to="/templates"
          className="mt-2 block w-full text-center text-sm font-bold text-black/40 hover:text-black"
        >
          템플릿 갤러리 둘러보기
        </Link>
        <Link
          to="/blog"
          className="mt-2 block w-full text-center text-sm font-bold text-black/40 hover:text-black"
        >
          블로그 둘러보기
        </Link>
      </div>
    </div>
  )
}
