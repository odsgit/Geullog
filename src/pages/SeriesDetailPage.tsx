import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppHeader } from '@/components/AppHeader'
import { exportAsTxt, exportPlainTextAsDocx } from '@/lib/export'

interface SeriesPart {
  id: string
  part_number: number | null
  output_text: string
  created_at: string
}

export function SeriesDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [seriesTitle, setSeriesTitle] = useState<string | null>(null)
  const [parts, setParts] = useState<SeriesPart[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    async function load() {
      const [{ data: series, error: seriesError }, { data: generations }] = await Promise.all([
        supabase.from('generation_series').select('title').eq('id', id!).single(),
        supabase
          .from('generations')
          .select('id, part_number, output_text, created_at')
          .eq('series_id', id!)
          .order('part_number', { ascending: true }),
      ])

      if (seriesError || !series) {
        setError('시리즈를 찾을 수 없습니다')
        return
      }
      setSeriesTitle(series.title)

      const withLatestVersions = await Promise.all(
        (generations ?? []).map(async (generation) => {
          const { data: versions } = await supabase
            .from('generation_versions')
            .select('output_text')
            .eq('generation_id', generation.id)
            .order('version_number', { ascending: false })
            .limit(1)

          return {
            ...generation,
            output_text: versions?.[0]?.output_text ?? generation.output_text ?? '',
          }
        }),
      )
      setParts(withLatestVersions)
    }

    load()
  }, [id])

  function handleDownloadPart(part: SeriesPart, format: 'txt' | 'docx') {
    const filename = `${seriesTitle ?? 'geullog-series'}-${part.part_number ?? '?'}화`
    if (format === 'txt') {
      exportAsTxt(filename, part.output_text)
    } else {
      exportPlainTextAsDocx(filename, part.output_text)
    }
  }

  function handleDownloadAll(format: 'txt' | 'docx') {
    if (!parts || parts.length === 0) return
    const combined = parts
      .map((part) => `--- ${part.part_number ?? '?'}화 ---\n\n${part.output_text}`)
      .join('\n\n\n')
    const filename = seriesTitle ?? 'geullog-series'
    if (format === 'txt') {
      exportAsTxt(filename, combined)
    } else {
      exportPlainTextAsDocx(filename, combined)
    }
  }

  return (
    <div className="min-h-svh bg-paper">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-12">
        <Link to="/series" className="text-sm text-ink/60 hover:text-ink">
          ← 시리즈 목록으로
        </Link>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {seriesTitle && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="font-serif text-2xl font-semibold text-ink">{seriesTitle}</h1>
            <div className="flex gap-2">
              <button type="button" onClick={() => handleDownloadAll('txt')} className="btn-sm">
                전체 .txt
              </button>
              <button type="button" onClick={() => handleDownloadAll('docx')} className="btn-sm">
                전체 .docx
              </button>
            </div>
          </div>
        )}

        {parts?.length === 0 && <p className="text-sm text-ink/50">아직 파트가 없어요.</p>}

        <div className="flex flex-col gap-3">
          {parts?.map((part) => (
            <div key={part.id} className="card flex flex-col gap-2 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-ink">{part.part_number ?? '?'}화</span>
                <div className="flex gap-2">
                  <Link to={`/history/${part.id}`} className="btn-sm">
                    편집하기
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDownloadPart(part, 'txt')}
                    className="btn-sm"
                  >
                    .txt
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadPart(part, 'docx')}
                    className="btn-sm"
                  >
                    .docx
                  </button>
                </div>
              </div>
              <p className="line-clamp-3 text-sm text-ink/70">{part.output_text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
