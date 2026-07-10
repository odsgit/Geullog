import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppHeader } from '@/components/AppHeader'
import { useAuth } from '@/hooks/useAuth'
import { docTypeOptions } from '@/lib/generationSchema'
import type { Database } from '@/types/supabase'

type Generation = Database['public']['Tables']['generations']['Row']

const docTypeLabel = new Map<string, string>(
  docTypeOptions.map((option) => [option.value, option.label]),
)

export function HistoryPage() {
  const { user } = useAuth()
  const [generations, setGenerations] = useState<Generation[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    // user_id로 거르지 않으면 "공개 글은 누구나 조회 가능" RLS 정책과 겹쳐 다른 유저가
    // 공유한 공개 글까지 이 개인 히스토리 목록에 섞여 나온다.
    supabase
      .from('generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setError(error.message)
          return
        }
        setGenerations(data)
      })
  }, [user])

  return (
    <div className="min-h-svh bg-paper">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-6 py-12">
        <h1 className="font-serif text-2xl font-semibold text-ink">히스토리</h1>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {generations && generations.length === 0 && (
          <p className="text-sm text-ink/50">아직 생성한 글이 없어요.</p>
        )}

        <ul className="flex flex-col gap-3">
          {generations?.map((generation) => (
            <li key={generation.id}>
              <Link to={`/history/${generation.id}`} className="card-link block p-5">
                <div className="flex items-center justify-between text-xs text-ink/50">
                  <span>{docTypeLabel.get(generation.doc_type) ?? generation.doc_type}</span>
                  <span>{new Date(generation.created_at).toLocaleString('ko-KR')}</span>
                </div>
                {generation.title && (
                  <p className="mt-2 text-sm font-semibold text-ink">{generation.title}</p>
                )}
                <p
                  className={`line-clamp-2 text-sm ${
                    generation.title ? 'mt-1 text-ink/70' : 'mt-2 text-ink'
                  }`}
                >
                  {generation.output_text ?? generation.input_text}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
