import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppHeader } from '@/components/AppHeader'
import { useAuth } from '@/hooks/useAuth'
import { isAdminEmail } from '@/lib/admin'

function maskApiKey(key: string): string {
  if (key.length <= 8) return '••••••••'
  return `${key.slice(0, 5)}${'•'.repeat(6)}${key.slice(-4)}`
}

const CREDIT_PACKAGES = [
  { amount: 10, label: '10 크레딧' },
  { amount: 30, label: '30 크레딧' },
  { amount: 100, label: '100 크레딧' },
  { amount: 300, label: '300 크레딧' },
]

export function SettingsPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const needsApiKey = searchParams.get('needKey') === '1'
  const isAdmin = isAdminEmail(user?.email)

  const [credits, setCredits] = useState<number | null>(null)
  const [chargingAmount, setChargingAmount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [chargedAmount, setChargedAmount] = useState<number | null>(null)

  const [savedApiKey, setSavedApiKey] = useState<string | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [apiKeySaving, setApiKeySaving] = useState(false)
  const [apiKeyError, setApiKeyError] = useState<string | null>(null)
  const [apiKeySaved, setApiKeySaved] = useState(false)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('credits')
      .single()
      .then(({ data }) => {
        if (data) setCredits(data.credits)
      })
  }, [])

  useEffect(() => {
    if (isAdmin) return
    supabase
      .from('profiles')
      .select('openai_api_key')
      .single()
      .then(({ data }) => {
        setSavedApiKey(data?.openai_api_key ?? null)
      })
  }, [isAdmin])

  async function handleCharge(amount: number) {
    setChargingAmount(amount)
    setError(null)
    setChargedAmount(null)

    const { data, error } = await supabase.rpc('charge_credits', { p_amount: amount })

    setChargingAmount(null)

    if (error) {
      setError('충전에 실패했어요. 잠시 후 다시 시도해 주세요.')
      return
    }

    const result = data as { success: boolean; reason?: string; credits?: number }
    if (!result.success) {
      setError('충전에 실패했어요. 잠시 후 다시 시도해 주세요.')
      return
    }

    setCredits(result.credits ?? null)
    setChargedAmount(amount)
  }

  async function handleSaveApiKey(event: FormEvent) {
    event.preventDefault()
    const trimmed = apiKeyInput.trim()
    if (!trimmed || !user) return

    setApiKeySaving(true)
    setApiKeyError(null)
    setApiKeySaved(false)

    const { error } = await supabase
      .from('profiles')
      .update({ openai_api_key: trimmed })
      .eq('id', user.id)

    setApiKeySaving(false)

    if (error) {
      setApiKeyError('저장에 실패했어요. 잠시 후 다시 시도해 주세요.')
      return
    }

    setSavedApiKey(trimmed)
    setApiKeyInput('')
    setApiKeySaved(true)
  }

  async function handleRemoveApiKey() {
    if (!user) return

    setApiKeySaving(true)
    setApiKeyError(null)
    setApiKeySaved(false)

    const { error } = await supabase
      .from('profiles')
      .update({ openai_api_key: null })
      .eq('id', user.id)

    setApiKeySaving(false)

    if (error) {
      setApiKeyError('삭제에 실패했어요. 잠시 후 다시 시도해 주세요.')
      return
    }

    setSavedApiKey(null)
  }

  return (
    <div className="min-h-svh bg-paper">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-12">
        <h1 className="font-serif text-2xl font-semibold text-ink">설정</h1>

        <section className="card p-5">
          <h2 className="font-serif text-lg font-semibold text-ink">계정</h2>
          <p className="mt-2 text-sm text-ink/70">{user?.email}</p>
        </section>

        <section className="card p-5">
          <h2 className="font-serif text-lg font-semibold text-ink">OpenAI API 키</h2>

          {isAdmin ? (
            <p className="mt-2 text-sm text-ink/70">
              관리자 계정은 별도의 API 키 입력 없이 모든 기능을 이용할 수 있어요.
            </p>
          ) : (
            <>
              {needsApiKey && !savedApiKey && (
                <p className="mt-2 rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                  글쓰기 등 생성 기능을 쓰려면 먼저 자신의 OpenAI API 키를 입력해야 해요.
                </p>
              )}

              <p className="mt-2 text-xs text-ink/50">
                입력한 키는 본인의 생성 요청에만 사용되며, 서버에만 저장되고 다른 사용자에게
                노출되지 않아요.
              </p>

              {savedApiKey && (
                <p className="mt-3 text-sm text-ink/70">
                  현재 등록된 키: <span className="font-mono">{maskApiKey(savedApiKey)}</span>
                </p>
              )}

              <form onSubmit={handleSaveApiKey} className="mt-4 flex flex-col gap-3">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(event) => setApiKeyInput(event.target.value)}
                  placeholder="sk-..."
                  autoComplete="off"
                  className="w-full rounded-md border border-line px-3 py-2 text-sm text-ink"
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={apiKeySaving || !apiKeyInput.trim()}
                    className="btn-primary disabled:opacity-50"
                  >
                    {apiKeySaving ? '저장 중...' : savedApiKey ? '키 변경' : '키 저장'}
                  </button>
                  {savedApiKey && (
                    <button
                      type="button"
                      onClick={handleRemoveApiKey}
                      disabled={apiKeySaving}
                      className="btn-sm disabled:opacity-50"
                    >
                      키 삭제
                    </button>
                  )}
                </div>
              </form>

              {apiKeySaved && (
                <p className="mt-3 text-sm text-ink/70">API 키가 저장되었어요.</p>
              )}
              {apiKeyError && <p className="mt-3 text-sm text-red-600">{apiKeyError}</p>}
            </>
          )}
        </section>

        <section className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold text-ink">크레딧</h2>
            {credits !== null && <span className="badge-accent">보유 {credits}개</span>}
          </div>

          <p className="mt-2 text-xs text-ink/50">
            아직 실제 결제는 연동되어 있지 않아요. 버튼을 누르면 바로 크레딧이 충전됩니다.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {CREDIT_PACKAGES.map((pkg) => (
              <button
                key={pkg.amount}
                type="button"
                onClick={() => handleCharge(pkg.amount)}
                disabled={chargingAmount !== null}
                className="btn-primary disabled:opacity-50"
              >
                {chargingAmount === pkg.amount ? '충전 중...' : pkg.label}
              </button>
            ))}
          </div>

          {chargedAmount !== null && (
            <p className="mt-3 text-sm text-ink/70">
              크레딧 {chargedAmount}개가 충전되었어요.
            </p>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </section>
      </main>
    </div>
  )
}
