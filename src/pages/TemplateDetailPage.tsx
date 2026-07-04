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
    <div className="min-h-svh bg-gray-50">
      <header className="border-b border-gray-100 bg-white px-6 py-4">
        <Link to="/" className="text-sm font-semibold text-gray-900">
          Geullog
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-col gap-4 px-6 py-12">
        <Link to="/templates" className="text-sm text-gray-500 hover:text-gray-700">
          ← 템플릿 갤러리로 돌아가기
        </Link>

        {notFound && (
          <p className="text-sm text-gray-500">존재하지 않거나 비공개로 전환된 템플릿이에요.</p>
        )}

        {template && (
          <div className="flex flex-col gap-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{template.title}</h1>
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
                    <span
                      key={label}
                      className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600"
                    >
                      {label}
                    </span>
                  ))}
              </div>
            </div>

            {template.prompt_text && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                {template.prompt_text}
              </p>
            )}

            <Link
              to="/"
              onClick={handleStart}
              className="rounded-lg bg-gray-900 px-4 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-gray-700"
            >
              이 템플릿으로 시작하기
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
