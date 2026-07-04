import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppHeader } from '@/components/AppHeader'
import { GenerationResult } from '@/components/GenerationResult'

export function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [initialText, setInitialText] = useState<string | null>(null)
  const [initialIsPublic, setInitialIsPublic] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return

    async function load() {
      const [{ data: generation, error: generationError }, { data: versions }] = await Promise.all([
        supabase.from('generations').select('*').eq('id', id!).single(),
        supabase
          .from('generation_versions')
          .select('*')
          .eq('generation_id', id!)
          .order('version_number', { ascending: false })
          .limit(1),
      ])

      if (generationError || !generation) {
        setError('생성 기록을 찾을 수 없습니다')
        return
      }

      setInitialText(versions?.[0]?.output_text ?? generation.output_text ?? '')
      setInitialIsPublic(generation.is_public)
    }

    load()
  }, [id])

  return (
    <div className="min-h-svh bg-paper">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-6 py-12">
        <Link to="/history" className="text-sm font-bold text-black/60 hover:text-black">
          ← 히스토리로 돌아가기
        </Link>

        {error && <p className="text-sm font-bold text-red-500">{error}</p>}

        {initialText !== null && id && (
          <div className="brutal-card p-8">
            <GenerationResult
              key={id}
              generationId={id}
              initialText={initialText}
              initialIsPublic={initialIsPublic}
            />
          </div>
        )}
      </main>
    </div>
  )
}
