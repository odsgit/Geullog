import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select } from '@/components/Select'
import { TextArea } from '@/components/TextArea'
import { ImageUpload } from '@/components/ImageUpload'
import { GenerationResult } from '@/components/GenerationResult'
import { useGeneration } from '@/hooks/useGeneration'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { TEMPLATE_STORAGE_KEY } from '@/lib/templateStorage'
import { CONTINUE_STORAGE_KEY } from '@/lib/continuationStorage'
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

interface AuthorStyleOption {
  id: string
  name: string
  nationality: string | null
  representative_works: string | null
}

interface NarrativeTypeOption {
  id: string
  name: string
}

export function GenerationForm() {
  const { user } = useAuth()
  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    reset,
    formState: { errors },
  } = useForm<GenerationFormValues>({
    resolver: zodResolver(generationFormSchema),
    defaultValues: { inputImageUrls: [] },
  })
  const { output, status, error, remainingCredits, generationId, generate } = useGeneration()

  const [showTemplateTitleInput, setShowTemplateTitleInput] = useState(false)
  const [templateTitle, setTemplateTitle] = useState('')
  const [templateSaved, setTemplateSaved] = useState(false)
  const [authorStyles, setAuthorStyles] = useState<AuthorStyleOption[]>([])
  const [narrativeTypes, setNarrativeTypes] = useState<NarrativeTypeOption[]>([])
  const [continuingFromId, setContinuingFromId] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('author_styles')
      .select('id, name, nationality, representative_works')
      .order('name')
      .then(({ data }) => setAuthorStyles(data ?? []))
  }, [])

  useEffect(() => {
    supabase
      .from('narrative_types')
      .select('id, name')
      .order('name')
      .then(({ data }) => setNarrativeTypes(data ?? []))
  }, [])

  useEffect(() => {
    const templateId = localStorage.getItem(TEMPLATE_STORAGE_KEY)
    if (!templateId) return

    supabase
      .from('templates')
      .select('doc_type, style, tone, target_audience, length, prompt_text')
      .eq('id', templateId)
      .eq('is_public', true)
      .single()
      .then(({ data }) => {
        if (data) {
          reset({
            inputText: data.prompt_text ?? '',
            docType: (data.doc_type ?? docTypeOptions[0].value) as GenerationFormValues['docType'],
            style: (data.style ?? styleOptions[0].value) as GenerationFormValues['style'],
            tone: (data.tone ?? toneOptions[0].value) as GenerationFormValues['tone'],
            targetAudience: (data.target_audience ??
              targetAudienceOptions[0].value) as GenerationFormValues['targetAudience'],
            length: (data.length ?? lengthOptions[0].value) as GenerationFormValues['length'],
            language: 'ko',
            inputImageUrls: [],
          })
        }
        localStorage.removeItem(TEMPLATE_STORAGE_KEY)
      })
  }, [reset])

  useEffect(() => {
    const continueId = localStorage.getItem(CONTINUE_STORAGE_KEY)
    if (!continueId) return

    supabase
      .from('generations')
      .select(
        'doc_type, style, tone, target_audience, length, language, author_style_id, narrative_type_id',
      )
      .eq('id', continueId)
      .single()
      .then(({ data }) => {
        if (data) {
          reset({
            inputText: '',
            docType: (data.doc_type ?? docTypeOptions[0].value) as GenerationFormValues['docType'],
            style: (data.style ?? styleOptions[0].value) as GenerationFormValues['style'],
            tone: (data.tone ?? toneOptions[0].value) as GenerationFormValues['tone'],
            targetAudience: (data.target_audience ??
              targetAudienceOptions[0].value) as GenerationFormValues['targetAudience'],
            length: (data.length ?? lengthOptions[0].value) as GenerationFormValues['length'],
            language: (data.language ?? 'ko') as GenerationFormValues['language'],
            inputImageUrls: [],
            authorStyleId: data.author_style_id ?? undefined,
            narrativeTypeId: data.narrative_type_id ?? undefined,
            continueFromGenerationId: continueId,
          })
          setContinuingFromId(continueId)
        }
        localStorage.removeItem(CONTINUE_STORAGE_KEY)
      })
  }, [reset])

  useEffect(() => {
    // After a continuation succeeds, point subsequent submits at the part
    // that was just created — otherwise resubmitting without navigating
    // back through GenerationResult's "이어서 쓰기" button would keep
    // continuing from the original source instead of the latest part.
    if (status === 'done' && generationId && continuingFromId) {
      setContinuingFromId(generationId)
      setValue('continueFromGenerationId', generationId)
      setValue('inputText', '')
    }
  }, [status, generationId, continuingFromId, setValue])

  function handleCancelContinuation() {
    setContinuingFromId(null)
    reset({
      inputText: '',
      inputImageUrls: [],
      authorStyleId: undefined,
      narrativeTypeId: undefined,
      continueFromGenerationId: undefined,
    })
  }

  async function handleSaveTemplate() {
    if (!user || !templateTitle.trim()) return

    const values = getValues()
    const { error: insertError } = await supabase.from('templates').insert({
      user_id: user.id,
      title: templateTitle.trim(),
      doc_type: values.docType,
      style: values.style,
      tone: values.tone,
      target_audience: values.targetAudience,
      length: values.length,
      prompt_text: values.inputText,
      is_public: true,
    })

    if (!insertError) {
      setTemplateSaved(true)
      setShowTemplateTitleInput(false)
      setTemplateTitle('')
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <form onSubmit={handleSubmit(generate)} className="card flex flex-col gap-6 p-8">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-ink">글 생성하기</h1>
          <p className="mt-1 text-sm text-ink/60">
            주제와 원하는 스타일을 알려주시면 AI가 글을 완성해드려요.
          </p>
        </div>

        {continuingFromId && (
          <div className="flex items-center justify-between rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink/70">
            <span>이전 글에 이어서 쓰는 중이에요</span>
            <button
              type="button"
              onClick={handleCancelContinuation}
              className="text-ink/50 hover:text-ink"
            >
              취소
            </button>
          </div>
        )}

        <TextArea
          label={continuingFromId ? '다음 내용 지시' : '주제 / 키워드'}
          placeholder={
            continuingFromId
              ? '예: 이제 주인공이 마을을 떠나는 장면을 이어서 써주세요'
              : '예: 여름 휴가지로 제주도를 추천하는 이유'
          }
          error={errors.inputText?.message}
          {...register('inputText')}
        />

        <Controller
          control={control}
          name="inputImageUrls"
          render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} />}
        />

        <Select
          label="작가 스타일 (선택)"
          placeholder="선택 안 함"
          options={authorStyles.map((style) => {
            const detail = [style.nationality, style.representative_works]
              .filter(Boolean)
              .join(' · ')
            return {
              value: style.id,
              label: detail ? `${style.name} (${detail})` : style.name,
            }
          })}
          error={errors.authorStyleId?.message}
          {...register('authorStyleId')}
        />

        <Select
          label="서술 유형 (선택)"
          placeholder="선택 안 함"
          options={narrativeTypes.map((type) => ({ value: type.id, label: type.name }))}
          error={errors.narrativeTypeId?.message}
          {...register('narrativeTypeId')}
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

        <button
          type="submit"
          disabled={status === 'analyzing_image' || status === 'streaming'}
          className="btn-primary w-full"
        >
          {status === 'analyzing_image'
            ? '사진 분석 중...'
            : status === 'streaming'
              ? '생성 중...'
              : continuingFromId
                ? '이어서 쓰기'
                : '글 생성하기'}
        </button>

        {showTemplateTitleInput ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={templateTitle}
              onChange={(event) => setTemplateTitle(event.target.value)}
              placeholder="템플릿 이름"
              className="input flex-1"
            />
            <button type="button" onClick={handleSaveTemplate} className="btn-sm">
              저장
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowTemplateTitleInput(true)}
            className="text-sm text-ink/50 hover:text-ink"
          >
            {templateSaved ? '템플릿 갤러리에 저장되었습니다!' : '이 설정을 템플릿으로 저장'}
          </button>
        )}
      </form>

      {status === 'done' && generationId ? (
        <div className="card p-8">
          <GenerationResult key={generationId} generationId={generationId} initialText={output} />
        </div>
      ) : (
        (output || status === 'error' || status === 'analyzing_image') && (
          <div className="card p-8">
            {error && <p className="text-sm text-red-600">{error}</p>}
            {status === 'analyzing_image' && (
              <p className="text-sm text-ink/50">사진을 분석하고 있어요...</p>
            )}
            {output && (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{output}</p>
            )}
            {status === 'done' && remainingCredits !== null && (
              <p className="mt-4 text-xs text-ink/50">남은 크레딧: {remainingCredits}</p>
            )}
          </div>
        )
      )}
    </div>
  )
}
