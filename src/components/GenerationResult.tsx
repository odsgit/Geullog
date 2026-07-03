import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { RichTextEditor, type RichTextEditorHandle } from '@/components/RichTextEditor'
import { exportAsTxt, exportAsDocx } from '@/lib/export'

type ActionMode = 'regenerate' | 'more_casual' | 'more_formal'

interface StreamEvent {
  delta?: string
  status?: 'analyzing_image'
  done?: boolean
  remainingCredits?: number
  error?: string
}

interface GenerationResultProps {
  generationId: string
  initialText: string
}

const actionLabels: Record<ActionMode, string> = {
  regenerate: '재생성',
  more_casual: '더 캐주얼하게',
  more_formal: '더 격식있게',
}

export function GenerationResult({ generationId, initialText }: GenerationResultProps) {
  const editorRef = useRef<RichTextEditorHandle>(null)
  const [busy, setBusy] = useState<ActionMode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null)

  async function runAction(mode: ActionMode) {
    setBusy(mode)
    setError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setError('로그인이 필요합니다')
      setBusy(null)
      return
    }

    const currentText = editorRef.current?.getText() ?? ''

    const res = await fetch('/api/regenerate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ generationId, mode, currentText }),
    })

    if (!res.ok || !res.body) {
      if (res.status === 402) {
        setError('크레딧이 부족합니다')
      } else {
        const body = await res.json().catch(() => null)
        setError(body?.error ?? `요청에 실패했습니다 (${res.status})`)
      }
      setBusy(null)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split('\n\n')
      buffer = events.pop() ?? ''

      for (const line of events) {
        if (!line.startsWith('data: ')) continue
        const payload: StreamEvent = JSON.parse(line.slice('data: '.length))

        if (payload.delta) fullText += payload.delta
        if (payload.error) setError(payload.error)
        if (payload.done) setRemainingCredits(payload.remainingCredits ?? null)
      }
    }

    if (fullText) {
      editorRef.current?.setContent(fullText)
    }
    setBusy(null)
  }

  function handleExportTxt() {
    exportAsTxt('geullog-generation', editorRef.current?.getText() ?? '')
  }

  function handleExportDocx() {
    exportAsDocx('geullog-generation', editorRef.current?.getJSON() ?? { type: 'doc', content: [] })
  }

  return (
    <div className="flex flex-col gap-4">
      <RichTextEditor ref={editorRef} content={initialText} />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {(['regenerate', 'more_casual', 'more_formal'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => runAction(mode)}
            disabled={busy !== null}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {busy === mode ? '처리 중...' : actionLabels[mode]}
          </button>
        ))}
        <div className="mx-1 h-full w-px self-stretch bg-gray-100" />
        <button
          type="button"
          onClick={handleExportTxt}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          .txt 내보내기
        </button>
        <button
          type="button"
          onClick={handleExportDocx}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          .docx 내보내기
        </button>
      </div>

      {remainingCredits !== null && (
        <p className="text-xs text-gray-400">남은 크레딧: {remainingCredits}</p>
      )}
    </div>
  )
}
