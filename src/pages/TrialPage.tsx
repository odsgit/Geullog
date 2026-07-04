import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select } from '@/components/Select'
import { TextArea } from '@/components/TextArea'
import { useTrialGeneration } from '@/hooks/useTrialGeneration'
import {
  docTypeOptions,
  styleOptions,
  toneOptions,
  targetAudienceOptions,
  lengthOptions,
  languageOptions,
  generationFormSchema,
  type GenerationFormValues,
} from '@/lib/generationSchema'

const TRIAL_USED_KEY = 'geullog_trial_used'

export function TrialPage() {
  const alreadyTried =
    typeof window !== 'undefined' && localStorage.getItem(TRIAL_USED_KEY) === 'true'
  const [showSignupModal, setShowSignupModal] = useState(false)

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

  return (
    <div className="min-h-svh bg-paper">
      <header className="border-b-[3px] border-black bg-white px-6 py-4">
        <Link to="/" className="text-lg font-black text-black">
          Geullog
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-col gap-6 px-6 py-12">
        <div>
          <h1 className="text-2xl font-black text-black">무료로 체험해보기</h1>
          <p className="mt-1 text-sm font-medium text-black/60">
            가입 없이 1회 무료로 AI 글쓰기를 체험할 수 있어요.
          </p>
        </div>

        {alreadyTried ? (
          <div className="brutal-card p-8 text-center">
            <p className="text-sm font-bold text-black/70">이미 무료 체험을 사용하셨어요.</p>
            <Link to="/login" className="brutal-btn-primary mt-4 inline-flex">
              가입하고 계속 쓰기
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="brutal-card flex flex-col gap-6 p-8">
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
                label="스타일"
                options={[...styleOptions]}
                error={errors.style?.message}
                {...register('style')}
              />
              <Select
                label="톤"
                options={[...toneOptions]}
                error={errors.tone?.message}
                {...register('tone')}
              />
              <Select
                label="타겟 독자"
                options={[...targetAudienceOptions]}
                error={errors.targetAudience?.message}
                {...register('targetAudience')}
              />
              <Select
                label="분량"
                options={[...lengthOptions]}
                error={errors.length?.message}
                {...register('length')}
              />
              <Select
                label="언어"
                options={[...languageOptions]}
                error={errors.language?.message}
                {...register('language')}
              />
            </div>

            <button type="submit" disabled={status === 'streaming'} className="brutal-btn-primary">
              {status === 'streaming' ? '생성 중...' : '무료로 체험 생성하기'}
            </button>
          </form>
        )}

        {(output || error) && (
          <div className="brutal-card p-8">
            {error && <p className="text-sm font-bold text-red-500">{error}</p>}
            {output && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-black">{output}</p>
            )}
          </div>
        )}
      </main>

      {showSignupModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 px-4">
          <div className="brutal-card w-full max-w-sm p-8 text-center">
            <h2 className="text-xl font-black text-black">체험은 어떠셨나요?</h2>
            <p className="mt-2 text-sm font-medium text-black/60">
              가입하면 매달 무료 크레딧으로 더 많이 쓸 수 있고, 히스토리 저장과 편집도
              가능해요.
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <Link to="/login" className="brutal-btn-primary">
                가입하러 가기
              </Link>
              <button
                type="button"
                onClick={() => setShowSignupModal(false)}
                className="text-sm font-bold text-black/50 hover:text-black"
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
