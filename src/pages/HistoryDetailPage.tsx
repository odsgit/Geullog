import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppHeader } from '@/components/AppHeader'
import { GenerationResult } from '@/components/GenerationResult'
import type { Database } from '@/types/supabase'

type Generation = Database['public']['Tables']['generations']['Row']

export function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [generation, setGeneration] = useState<Generation | null>(null)
  const [initialText, setInitialText] = useState<string | null>(null)
  const [seriesInfo, setSeriesInfo] = useState<{ id: string; partNumber: number | null } | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    async function load() {
      const [{ data: gen, error: generationError }, { data: currentVersion }] = await Promise.all([
        supabase.from('generations').select('*').eq('id', id!).single(),
        supabase
          .from('generation_versions')
          .select('output_text')
          .eq('generation_id', id!)
          .order('version_number', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])

      if (generationError || !gen) {
        setError('생성 기록을 찾을 수 없습니다')
        return
      }

      setGeneration(gen)
      setInitialText(currentVersion?.output_text ?? gen.output_text ?? '')
      if (gen.series_id) {
        setSeriesInfo({ id: gen.series_id, partNumber: gen.part_number })
      }
    }

    load()
  }, [id])

  return (
    <div className="min-h-svh bg-paper">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-6 py-12">
        <Link to="/history" className="text-sm text-ink/60 hover:text-ink">
          ← 히스토리로 돌아가기
        </Link>

        {seriesInfo && (
          <Link
            to={`/series/${seriesInfo.id}`}
            className="w-fit text-sm text-ink/60 hover:text-ink"
          >
            시리즈 {seriesInfo.partNumber ?? '?'}화 · 전체 시리즈 보기 →
          </Link>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {initialText !== null && id && generation && (
          <div className="card p-8">
            <GenerationResult
              key={id}
              generationId={id}
              initialText={initialText}
              initialIsPublic={generation.is_public}
            />
          </div>
        )}
      </main>
    </div>
  )
}
