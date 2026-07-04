import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { docTypeOptions, styleOptions, toneOptions } from '@/lib/generationSchema'

interface TemplateSummary {
  id: string
  title: string
  doc_type: string | null
  style: string | null
  tone: string | null
}

function labelOf(options: readonly { value: string; label: string }[], value: string | null) {
  return options.find((option) => option.value === value)?.label
}

export function TemplateGalleryPage() {
  const [templates, setTemplates] = useState<TemplateSummary[] | null>(null)

  useEffect(() => {
    supabase
      .from('templates')
      .select('id, title, doc_type, style, tone')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setTemplates(data ?? []))
  }, [])

  return (
    <div className="min-h-svh bg-paper">
      <header className="border-b-[3px] border-black bg-white px-6 py-4">
        <Link to="/" className="text-lg font-black text-black">
          Geullog
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
        <div>
          <h1 className="text-2xl font-black text-black">템플릿 갤러리</h1>
          <p className="mt-1 text-sm font-medium text-black/60">
            다른 사용자가 공유한 프롬프트 조합으로 바로 글쓰기를 시작해보세요.
          </p>
        </div>

        {templates?.length === 0 && (
          <p className="text-sm font-bold text-black/50">아직 공개된 템플릿이 없어요.</p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {templates?.map((template) => (
            <Link
              key={template.id}
              to={`/templates/${template.id}`}
              className="brutal-card-link flex flex-col gap-2 p-6"
            >
              <h2 className="font-bold text-black">{template.title}</h2>
              <div className="flex flex-wrap gap-1.5">
                {labelOf(docTypeOptions, template.doc_type) && (
                  <span className="brutal-badge">{labelOf(docTypeOptions, template.doc_type)}</span>
                )}
                {labelOf(styleOptions, template.style) && (
                  <span className="brutal-badge">{labelOf(styleOptions, template.style)}</span>
                )}
                {labelOf(toneOptions, template.tone) && (
                  <span className="brutal-badge">{labelOf(toneOptions, template.tone)}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
