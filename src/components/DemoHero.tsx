import { useState } from 'react'
import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { motion, useReducedMotion } from 'framer-motion'
import { useTrialGeneration } from '@/hooks/useTrialGeneration'
import { TRIAL_USED_KEY } from '@/lib/trialStorage'
import type { GenerationFormValues } from '@/lib/generationSchema'

const DEMO_DEFAULTS: Omit<GenerationFormValues, 'inputText'> = {
  docType: 'blog',
  tone: 'friendly',
  targetAudience: 'general',
  length: 'short',
  language: 'ko',
  inputImageUrls: [],
}

// Landing-page hero that lets an anonymous visitor see AI writing happen
// immediately, no signup required — reuses the same one-shot trial as
// /trial (functions/api/trial-generate.ts), just a lower-friction entry point.
export function DemoHero() {
  const [topic, setTopic] = useState('')
  const [textCopied, setTextCopied] = useState(false)
  const alreadyTried =
    typeof window !== 'undefined' && localStorage.getItem(TRIAL_USED_KEY) === 'true'
  const { output, status, error, generate } = useTrialGeneration()
  const shouldReduceMotion = useReducedMotion()

  async function handleGenerate() {
    if (!topic.trim()) return
    await generate({ ...DEMO_DEFAULTS, inputText: topic.trim() })
    localStorage.setItem(TRIAL_USED_KEY, 'true')
  }

  async function handleCopyText() {
    await navigator.clipboard.writeText(output)
    setTextCopied(true)
    setTimeout(() => setTextCopied(false), 2000)
  }

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 16 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div>
        <h1 className="font-serif text-3xl leading-tight font-semibold text-ink sm:text-4xl">
          AI가 완성하는
          <br />
          나만의 글쓰기
        </h1>
        <p className="mt-3 text-base text-ink/60">
          주제만 알려주면 블로그, 상품 설명, SNS 캡션까지 AI가 써드려요. 지금 바로 체험해보세요.
        </p>
      </div>

      <div className="card p-6">
        {alreadyTried && status === 'idle' ? (
          <div className="flex flex-col items-center gap-3 py-2 text-center">
            <p className="text-sm text-ink/70">이미 무료 체험을 사용하셨어요.</p>
            <Link to="/trial" className="btn">
              체험 페이지에서 자세히 보기
            </Link>
          </div>
        ) : (
          <>
            <label htmlFor="demo-topic" className="text-sm font-semibold text-ink/80">
              어떤 주제로 써볼까요?
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="demo-topic"
                type="text"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="예: 여름 휴가지로 제주도를 추천하는 이유"
                className="input flex-1"
                disabled={status === 'streaming'}
              />
              <button
                type="button"
                onClick={handleGenerate}
                disabled={status === 'streaming' || !topic.trim()}
                className="btn-primary shrink-0"
              >
                {status === 'streaming' ? '생성 중...' : '지금 써보기'}
              </button>
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            {output && (
              <>
                <div className="prose prose-sm mt-4 max-w-none rounded-xl bg-paper p-4 leading-relaxed">
                  <ReactMarkdown>{output}</ReactMarkdown>
                </div>
                <button type="button" onClick={handleCopyText} className="btn-sm mt-2">
                  {textCopied ? '복사되었습니다!' : '복사하기'}
                </button>
              </>
            )}

            {status === 'done' && (
              <Link to="/login" className="btn-primary mt-4 w-full">
                가입하고 계속 써보기
              </Link>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
