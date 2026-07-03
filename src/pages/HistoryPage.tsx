import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { AppHeader } from '@/components/AppHeader'
import { docTypeOptions } from '@/lib/generationSchema'
import type { Database } from '@/types/supabase'

type Generation = Database['public']['Tables']['generations']['Row']

const docTypeLabel = new Map<string, string>(
  docTypeOptions.map((option) => [option.value, option.label]),
)

export function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('generations')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setError(error.message)
          return
        }
        setGenerations(data)
      })
  }, [])

  return (
    <div className="min-h-svh bg-gray-50">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-6 py-12">
        <h1 className="text-xl font-semibold text-gray-900">히스토리</h1>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {generations && generations.length === 0 && (
          <p className="text-sm text-gray-400">아직 생성한 글이 없어요.</p>
        )}

        <ul className="flex flex-col gap-3">
          {generations?.map((generation) => (
            <li key={generation.id}>
              <Link
                to={`/history/${generation.id}`}
                className="block rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-colors hover:border-gray-300"
              >
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{docTypeLabel.get(generation.doc_type) ?? generation.doc_type}</span>
                  <span>{new Date(generation.created_at).toLocaleString('ko-KR')}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-gray-900">
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
