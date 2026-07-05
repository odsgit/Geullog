import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { RichTextEditor, type RichTextEditorHandle } from '@/components/RichTextEditor'
import { VersionTimeline } from '@/components/VersionTimeline'
import { exportAsTxt, exportAsDocx } from '@/lib/export'
import { trackEvent } from '@/lib/analytics'
import { CONTINUE_STORAGE_KEY } from '@/lib/continuationStorage'
import type { Database } from '@/types/supabase'

type GenerationVersion = Database['public']['Tables']['generation_versions']['Row']

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
  initialIsPublic?: boolean
}

const actionLabels: Record<ActionMode, string> = {
  regenerate: '재생성',
  more_casual: '더 캐주얼하게',
  more_formal: '더 격식있게',
}

export function GenerationResult({
  generationId,
  initialText,
  initialIsPublic = false,
}: GenerationResultProps) {
  const editorRef = useRef<RichTextEditorHandle>(null)
  const [busy, setBusy] = useState<ActionMode | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null)
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [shareCopied, setShareCopied] = useState(false)

  // 재생성/톤조정/되돌리기가 만드는 버전 히스토리 — 홈 화면(생성 직후)과 히스토리 상세
  // 페이지 양쪽에서 똑같이 보이도록 이 컴포넌트가 직접 관리한다(예전엔 히스토리 상세
  // 페이지에만 있어서 방금 생성한 결과에서는 되돌리기를 쓸 수 없었음).
  const [versions, setVersions] = useState<GenerationVersion[]>([])
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null)
  const [revertingId, setRevertingId] = useState<string | null>(null)

  const loadVersions = useCallback(async () => {
    const [{ data: versionRows }, { data: generation }] = await Promise.all([
      supabase
        .from('generation_versions')
        .select('*')
        .eq('generation_id', generationId)
        .order('version_number', { ascending: false }),
      supabase.from('generations').select('current_version_id').eq('id', generationId).single(),
    ])

    setVersions(versionRows ?? [])
    setCurrentVersionId(generation?.current_version_id ?? versionRows?.[0]?.id ?? null)
  }, [generationId])

  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  async function handleRevert(versionId: string) {
    setRevertingId(versionId)

    const { data, error: revertError } = await supabase.rpc('revert_generation_version', {
      p_generation_id: generationId,
      p_version_id: versionId,
    })

    setRevertingId(null)

    if (revertError) {
      setError('되돌리기에 실패했습니다')
      return
    }

    const result = Array.isArray(data) ? data[0] : data
    if (result?.output_text) {
      editorRef.current?.setContent(result.output_text)
    }
    trackEvent('version_reverted', { generation_id: generationId, from_version_id: versionId })
    await loadVersions()
  }

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
      await loadVersions()
    }
    setBusy(null)
  }

  function handleExportTxt() {
    exportAsTxt('geullog-generation', editorRef.current?.getText() ?? '')
  }

  function handleExportDocx() {
    exportAsDocx('geullog-generation', editorRef.current?.getJSON() ?? { type: 'doc', content: [] })
  }

  async function handleShare() {
    const { error: updateError } = await supabase
      .from('generations')
      .update({ is_public: true })
      .eq('id', generationId)

    if (updateError) {
      setError('공유 링크 생성에 실패했습니다')
      return
    }

    setIsPublic(true)
    await navigator.clipboard.writeText(`${window.location.origin}/share/${generationId}`)
    setShareCopied(true)
    trackEvent('share_clicked', { generation_id: generationId })
    setTimeout(() => setShareCopied(false), 2000)
  }

  async function handleUnpublish() {
    const { error: updateError } = await supabase
      .from('generations')
      .update({ is_public: false })
      .eq('id', generationId)

    if (!updateError) setIsPublic(false)
  }

  function handleContinue() {
    localStorage.setItem(CONTINUE_STORAGE_KEY, generationId)
    // Hard navigation: this result can already be rendered on "/" itself
    // (right after generating), and react-router's navigate('/') is a no-op
    // there, so GenerationForm would never remount to pick up localStorage.
    window.location.href = '/'
  }

  return (
    <div className="flex flex-col gap-4">
      <RichTextEditor ref={editorRef} content={initialText} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {(['regenerate', 'more_casual', 'more_formal'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => runAction(mode)}
            disabled={busy !== null}
            className="btn-sm"
          >
            {busy === mode ? '처리 중...' : actionLabels[mode]}
          </button>
        ))}
        <div className="mx-1 h-full w-px self-stretch bg-line" />
        <button type="button" onClick={handleContinue} className="btn-sm">
          이어서 쓰기
        </button>
        <div className="mx-1 h-full w-px self-stretch bg-line" />
        <button type="button" onClick={handleExportTxt} className="btn-sm">
          .txt 내보내기
        </button>
        <button type="button" onClick={handleExportDocx} className="btn-sm">
          .docx 내보내기
        </button>
        <div className="mx-1 h-full w-px self-stretch bg-line" />
        <button type="button" onClick={handleShare} className="btn-sm">
          {shareCopied ? '링크가 복사되었습니다!' : isPublic ? '공유 링크 복사' : '공유하기'}
        </button>
        {isPublic && (
          <button type="button" onClick={handleUnpublish} className="btn-sm">
            비공개로 전환
          </button>
        )}
      </div>

      {remainingCredits !== null && (
        <p className="text-xs text-ink/50">남은 크레딧: {remainingCredits}</p>
      )}

      <VersionTimeline
        versions={versions}
        currentVersionId={currentVersionId}
        onRevert={handleRevert}
        revertingId={revertingId}
      />
    </div>
  )
}
