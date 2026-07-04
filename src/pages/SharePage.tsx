import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { docTypeOptions } from '@/lib/generationSchema'

export function SharePage() {
  const { id } = useParams<{ id: string }>()
  const [docType, setDocType] = useState<string | null>(null)
  const [text, setText] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return

    async function load() {
      const [{ data: generation }, { data: versions }] = await Promise.all([
        supabase.from('generations').select('doc_type, output_text').eq('id', id!).single(),
        supabase
          .from('generation_versions')
          .select('output_text')
          .eq('generation_id', id!)
          .order('version_number', { ascending: false })
          .limit(1),
      ])

      if (!generation) {
        setNotFound(true)
        return
      }

      setDocType(generation.doc_type)
      setText(versions?.[0]?.output_text ?? generation.output_text ?? '')
    }

    load()
  }, [id])

  const docTypeLabel = docTypeOptions.find((option) => option.value === docType)?.label

  return (
    <div className="min-h-svh bg-paper">
      <header className="border-b border-line bg-white px-6 py-4">
        <Link to="/" className="font-serif text-lg font-semibold text-ink">
          Geullog
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-6 py-12">
        {notFound && (
          <p className="text-sm text-ink/60">
            존재하지 않거나 비공개로 전환된 글이에요.{' '}
            <Link to="/" className="text-ink underline">
              홈으로 돌아가기
            </Link>
          </p>
        )}

        {text !== null && (
          <div className="card flex flex-col gap-6 p-8">
            {docTypeLabel && <span className="badge w-fit">{docTypeLabel}</span>}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{text}</p>
          </div>
        )}

        {text !== null && (
          <Link to="/" className="btn-primary w-full">
            나도 Geullog로 만들어보기
          </Link>
        )}
      </main>
    </div>
  )
}
