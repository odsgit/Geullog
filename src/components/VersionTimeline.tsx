import { useState } from 'react'

interface VersionRow {
  id: string
  version_number: number
  version_type: string
  output_text: string
  created_at: string
}

interface VersionTimelineProps {
  versions: VersionRow[]
  currentVersionId: string | null
  onRevert: (versionId: string) => void
  revertingId: string | null
}

const versionTypeLabels: Record<string, string> = {
  generated: '생성',
  reverted: '되돌리기',
  tone_adjusted: '톤 조정',
}

export function VersionTimeline({
  versions,
  currentVersionId,
  onRevert,
  revertingId,
}: VersionTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (versions.length === 0) return null

  return (
    <div className="card flex flex-col gap-2 p-5">
      <h2 className="font-serif text-lg font-semibold text-ink">버전 기록</h2>

      <ul className="flex flex-col gap-2">
        {versions.map((version) => {
          const isCurrent = version.id === currentVersionId
          const isExpanded = expandedId === version.id

          return (
            <li key={version.id} className="rounded-xl border border-line px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : version.id)}
                  className="flex items-center gap-2 text-left text-sm text-ink/80 hover:text-ink"
                >
                  <span className="font-medium">v{version.version_number}</span>
                  <span className="badge">{versionTypeLabels[version.version_type] ?? version.version_type}</span>
                  {isCurrent && <span className="badge-accent">현재</span>}
                  <span className="text-xs text-ink/40">
                    {new Date(version.created_at).toLocaleString('ko-KR')}
                  </span>
                </button>

                {!isCurrent && (
                  <button
                    type="button"
                    onClick={() => onRevert(version.id)}
                    disabled={revertingId !== null}
                    className="btn-sm shrink-0"
                  >
                    {revertingId === version.id ? '되돌리는 중...' : '이 버전으로 되돌리기'}
                  </button>
                )}
              </div>

              {isExpanded && (
                <p className="mt-2 max-h-48 overflow-y-auto rounded-lg bg-paper px-3 py-2 text-xs whitespace-pre-wrap text-ink/70">
                  {version.output_text}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
