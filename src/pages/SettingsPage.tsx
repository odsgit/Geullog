import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { AppHeader } from '@/components/AppHeader'
import { useAuth } from '@/hooks/useAuth'

const CREDIT_PACKAGES = [
  { amount: 10, label: '10 크레딧' },
  { amount: 30, label: '30 크레딧' },
  { amount: 100, label: '100 크레딧' },
  { amount: 300, label: '300 크레딧' },
]

export function SettingsPage() {
  const { user } = useAuth()
  const [credits, setCredits] = useState<number | null>(null)
  const [chargingAmount, setChargingAmount] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [chargedAmount, setChargedAmount] = useState<number | null>(null)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('credits')
      .single()
      .then(({ data }) => {
        if (data) setCredits(data.credits)
      })
  }, [])

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
