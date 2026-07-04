import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import {
  docTypeOptions,
  styleOptions,
  toneOptions,
  targetAudienceOptions,
  lengthOptions,
} from '@/lib/generationSchema'
import { TEMPLATE_STORAGE_KEY } from '@/lib/templateStorage'

interface TemplateDetail {
  id: string
  title: string
  doc_type: string | null
  style: string | null
  tone: string | null
  target_audience: string | null
  length: string | null
  prompt_text: string | null
}

function labelOf(options: readonly { value: string; label: string }[], value: string | null) {
  return options.find((option) => option.value === value)?.label
}

export function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [template, setTemplate] = useState<TemplateDetail | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return

    supabase
      .from('templates')
      .select('id, title, doc_type, style, tone, target_audience, length, prompt_text')
      .eq('id', id)
      .eq('is_public', true)
      .single()
      .then(({ data }) => {
        if (!data) {
          setNotFound(true)
          return
        }
        setTemplate(data)
      })
  }, [id])

  function handleStart() {
    if (!id) return
    localStorage.setItem(TEMPLATE_STORAGE_KEY, id)
  }

  return (
    <div className="min-h-svh bg-paper">
      <header className="border-b-[3px] border-black bg-white px-6 py-4">
        <Link to="/" className="text-lg font-black text-black">
          Geullog
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-6 py-12">
        <Link to="/templates" className="text-sm font-bold text-black/60 hover:text-black">
          ← 템플릿 갤러리로 돌아가기
        </Link>

        {notFound && (
          <p className="text-sm font-bold text-black/60">
            존재하지 않거나 비공개로 전환된 템플릿이에요.
          </p>
        )}

        {template && (
          <div className="brutal-card flex flex-col gap-6 p-8">
            <div>
              <h1 className="text-xl font-black text-black">{template.title}</h1>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                  labelOf(docTypeOptions, template.doc_type),
                  labelOf(styleOptions, template.style),
                  labelOf(toneOptions, template.tone),
                  labelOf(targetAudienceOptions, template.target_audience),
                  labelOf(lengthOptions, template.length),
                ]
                  .filter(Boolean)
                  .map((label) => (
                    <span key={label} className="brutal-badge">
                      {label}
                    </span>
                  ))}
              </div>
            </div>

            {template.prompt_text && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-black/80">
                {template.prompt_text}
              </p>
            )}

            <Link to="/" onClick={handleStart} className="brutal-btn-primary">
              이 템플릿으로 시작하기
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
