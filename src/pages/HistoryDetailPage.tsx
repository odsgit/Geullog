import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppHeader } from '@/components/AppHeader'
import { GenerationResult } from '@/components/GenerationResult'
import { VersionTimeline } from '@/components/VersionTimeline'
import { trackEvent } from '@/lib/analytics'
import type { Database } from '@/types/supabase'

type Generation = Database['public']['Tables']['generations']['Row']
type GenerationVersion = Database['public']['Tables']['generation_versions']['Row']

export function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [generation, setGeneration] = useState<Generation | null>(null)
  const [versions, setVersions] = useState<GenerationVersion[]>([])
  const [initialText, setInitialText] = useState<string | null>(null)
  const [seriesInfo, setSeriesInfo] = useState<{ id: string; partNumber: number | null } | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const [revertingId, setRevertingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!id) return

    const [{ data: gen, error: generationError }, { data: versionRows }] = await Promise.all([
      supabase.from('generations').select('*').eq('id', id).single(),
      supabase
        .from('generation_versions')
        .select('*')
        .eq('generation_id', id)
        .order('version_number', { ascending: false }),
    ])

    if (generationError || !gen) {
      setError('생성 기록을 찾을 수 없습니다')
      return
    }

    const allVersions = versionRows ?? []
    const current = gen.current_version_id
      ? allVersions.find((version) => version.id === gen.current_version_id)
      : allVersions[0]

    setGeneration(gen)
    setVersions(allVersions)
    setInitialText(current?.output_text ?? gen.output_text ?? '')
    if (gen.series_id) {
      setSeriesInfo({ id: gen.series_id, partNumber: gen.part_number })
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function handleRevert(versionId: string) {
    if (!id) return
    setRevertingId(versionId)

    const { error: revertError } = await supabase.rpc('revert_generation_version', {
      p_generation_id: id,
      p_version_id: versionId,
    })

    setRevertingId(null)

    if (revertError) {
      setError('되돌리기에 실패했습니다')
      return
    }

    trackEvent('version_reverted', { generation_id: id, from_version_id: versionId })
    await load()
  }

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
              key={generation.current_version_id ?? id}
              generationId={id}
              initialText={initialText}
              initialIsPublic={generation.is_public}
              onVersionCreated={load}
            />
          </div>
        )}

        <VersionTimeline
          versions={versions}
          currentVersionId={generation?.current_version_id ?? null}
          onRevert={handleRevert}
          revertingId={revertingId}
        />
      </main>
    </div>
  )
}
