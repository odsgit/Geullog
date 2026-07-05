import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import ReactMarkdown from 'react-markdown'
import { Select } from '@/components/Select'
import { TextArea } from '@/components/TextArea'
import { useTrialGeneration } from '@/hooks/useTrialGeneration'
import {
  docTypeOptions,
  targetAudienceOptions,
  generationFormSchema,
  type GenerationFormValues,
} from '@/lib/generationSchema'
import { TRIAL_USED_KEY } from '@/lib/trialStorage'

export function TrialPage() {
  const alreadyTried =
    typeof window !== 'undefined' && localStorage.getItem(TRIAL_USED_KEY) === 'true'
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [textCopied, setTextCopied] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GenerationFormValues>({
    resolver: zodResolver(generationFormSchema),
    defaultValues: { inputImageUrls: [] },
  })
  const { output, status, error, generate } = useTrialGeneration()

  async function onSubmit(values: GenerationFormValues) {
    await generate(values)
    localStorage.setItem(TRIAL_USED_KEY, 'true')
    setShowSignupModal(true)
  }

  async function handleCopyText() {
    await navigator.clipboard.writeText(output)
    setTextCopied(true)
    setTimeout(() => setTextCopied(false), 2000)
  }

  return (
    <div className="min-h-svh bg-paper">
      <header className="border-b border-line bg-white px-6 py-4">
        <Link to="/" className="font-serif text-lg font-semibold text-ink">
          Geullog
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-12">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">무료로 체험해보기</h1>
          <p className="mt-1 text-sm text-ink/60">
            가입 없이 1회 무료로 AI 글쓰기를 체험할 수 있어요.
          </p>
        </div>

        {alreadyTried ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-ink/70">이미 무료 체험을 사용하셨어요.</p>
            <Link to="/login" className="btn-primary mt-4 inline-flex">
              가입하고 계속 쓰기
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="card flex flex-col gap-6 p-8">
            <TextArea
              label="주제 / 키워드"
              placeholder="예: 여름 휴가지로 제주도를 추천하는 이유"
              error={errors.inputText?.message}
              {...register('inputText')}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="글 종류"
                options={[...docTypeOptions]}
                error={errors.docType?.message}
                {...register('docType')}
              />
              <Select
                label="타겟 독자"
                options={[...targetAudienceOptions]}
                error={errors.targetAudience?.message}
                {...register('targetAudience')}
              />
            </div>

            <TextArea
              label="AI에게 추가 요청 (선택)"
              placeholder="예: 반말로 작성해줘 / SEO를 고려해줘"
              rows={2}
              error={errors.additionalInstruction?.message}
              {...register('additionalInstruction')}
            />

            <button type="submit" disabled={status === 'streaming'} className="btn-primary">
              {status === 'streaming' ? '생성 중...' : '무료로 체험 생성하기'}
            </button>
          </form>
        )}

        {(output || error) && (
          <div className="card p-8">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {output && (
              <>
                <div className="prose prose-sm max-w-none leading-relaxed">
                  <ReactMarkdown>{output}</ReactMarkdown>
                </div>
                <button type="button" onClick={handleCopyText} className="btn-sm mt-4">
                  {textCopied ? '복사되었습니다!' : '복사하기'}
                </button>
              </>
            )}
          </div>
        )}
      </main>

      {showSignupModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-ink/50 px-4">
          <div className="card w-full max-w-sm p-8 text-center">
            <h2 className="font-serif text-xl font-semibold text-ink">체험은 어떠셨나요?</h2>
            <p className="mt-2 text-sm text-ink/60">
              가입하면 매달 무료 크레딧으로 더 많이 쓸 수 있고, 히스토리 저장과 편집도
              가능해요.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link to="/login" className="btn-primary">
                가입하러 가기
              </Link>
              <button
                type="button"
                onClick={() => setShowSignupModal(false)}
                className="text-sm text-ink/50 hover:text-ink"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
