import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppHeader } from '@/components/AppHeader'

interface SeriesSummary {
  id: string
  title: string
  created_at: string
  partCount: number
}

export function SeriesPage() {
  const [seriesList, setSeriesList] = useState<SeriesSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [{ data: series, error: seriesError }, { data: generations }] = await Promise.all([
        supabase
          .from('generation_series')
          .select('id, title, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('generations').select('series_id').not('series_id', 'is', null),
      ])

      if (seriesError) {
        setError(seriesError.message)
        return
      }

      const counts = new Map<string, number>()
      for (const generation of generations ?? []) {
        if (!generation.series_id) continue
        counts.set(generation.series_id, (counts.get(generation.series_id) ?? 0) + 1)
      }

      setSeriesList(
        (series ?? []).map((entry) => ({ ...entry, partCount: counts.get(entry.id) ?? 0 })),
      )
    }

    load()
  }, [])

  return (
    <div className="min-h-svh bg-paper">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-6 py-12">
        <h1 className="font-serif text-2xl font-semibold text-ink">시리즈</h1>
        <p className="text-sm text-ink/60">
          이어서 쓰기로 연결한 여러 편의 글을 한곳에서 모아볼 수 있어요.
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {seriesList && seriesList.length === 0 && (
          <p className="text-sm text-ink/50">
            아직 시리즈가 없어요. 생성 결과에서 "이어서 쓰기"를 눌러 시작해보세요.
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {seriesList?.map((series) => (
            <li key={series.id}>
              <Link to={`/series/${series.id}`} className="card-link block p-5">
                <div className="flex items-center justify-between text-xs text-ink/50">
                  <span>{series.partCount}개 파트</span>
                  <span>{new Date(series.created_at).toLocaleString('ko-KR')}</span>
                </div>
                <p className="mt-2 font-semibold text-ink">{series.title}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
