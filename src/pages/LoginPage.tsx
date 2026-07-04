import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Input } from '@/components/Input'
import { DemoHero } from '@/components/DemoHero'
import { FeatureHighlights } from '@/components/FeatureHighlights'

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
    <div className="min-h-svh bg-paper px-4 py-10 sm:py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
        <div className="lg:w-3/5">
          <Link to="/" className="font-serif text-lg font-semibold text-ink">
            Geullog
          </Link>
          <div className="mt-8">
            <DemoHero />
          </div>
        </div>

        <div className="card w-full p-8 lg:w-2/5">
          <div className="mb-6 text-center">
            <p className="text-sm text-ink/60">
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
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            {message && <p className="text-sm text-ink/70">{message}</p>}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {mode === 'signIn' ? '로그인' : '회원가입'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs text-ink/50">또는</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <button type="button" onClick={handleGoogleSignIn} className="btn w-full">
            Google로 계속하기
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}
            className="mt-5 w-full text-center text-sm text-ink/60 hover:text-ink"
          >
            {mode === 'signIn' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
          </button>

          <Link
            to="/trial"
            className="mt-2 block w-full text-center text-sm text-ink/40 hover:text-ink"
          >
            가입 없이 먼저 체험해보기
          </Link>
          <Link
            to="/templates"
            className="mt-2 block w-full text-center text-sm text-ink/40 hover:text-ink"
          >
            템플릿 갤러리 둘러보기
          </Link>
          <Link
            to="/blog"
            className="mt-2 block w-full text-center text-sm text-ink/40 hover:text-ink"
          >
            블로그 둘러보기
          </Link>
        </div>
      </div>

      <FeatureHighlights />
    </div>
  )
}
