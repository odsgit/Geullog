import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import ReactMarkdown from 'react-markdown'
import { Select } from '@/components/Select'
import { TextArea } from '@/components/TextArea'
import { ImageUpload } from '@/components/ImageUpload'
import { GenerationResult } from '@/components/GenerationResult'
import { useGeneration } from '@/hooks/useGeneration'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { TEMPLATE_STORAGE_KEY } from '@/lib/templateStorage'
import { CONTINUE_STORAGE_KEY } from '@/lib/continuationStorage'
import { DOC_TYPE_CATEGORY, DEVELOPMENT_STRUCTURES, stylePresetOptions } from '@/lib/constants'
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
  tier: string
}

interface SeriesPart {
  id: string
  part_number: number | null
  output_text: string
}

async function loadSeriesParts(seedGenerationId: string): Promise<SeriesPart[]> {
  const { data: seed } = await supabase
    .from('generations')
    .select('id, series_id, part_number, output_text')
    .eq('id', seedGenerationId)
    .single()

  if (!seed) return []

  let rows: SeriesPart[]
  if (seed.series_id) {
    const { data } = await supabase
      .from('generations')
      .select('id, part_number, output_text')
      .eq('series_id', seed.series_id)
      .order('part_number', { ascending: true })
    rows = (data ?? []).map((row) => ({ ...row, output_text: row.output_text ?? '' }))
  } else {
    rows = [{ id: seed.id, part_number: seed.part_number ?? 1, output_text: seed.output_text ?? '' }]
  }

  return Promise.all(
    rows.map(async (part) => {
      const { data: versions } = await supabase
        .from('generation_versions')
        .select('output_text')
        .eq('generation_id', part.id)
        .order('version_number', { ascending: false })
        .limit(1)

      return { ...part, output_text: versions?.[0]?.output_text ?? part.output_text ?? '' }
    }),
  )
}

export function GenerationForm() {
  const { user } = useAuth()
  const {
    register,
    control,
    handleSubmit,
    getValues,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<GenerationFormValues>({
    resolver: zodResolver(generationFormSchema),
    defaultValues: { inputImageUrls: [] },
  })
  const [useCustomLanguage, setUseCustomLanguage] = useState(false)
  const { output, status, error, remainingCredits, generationId, generate } = useGeneration()

  const [showTemplateTitleInput, setShowTemplateTitleInput] = useState(false)
  const [templateTitle, setTemplateTitle] = useState('')
  const [templateSaved, setTemplateSaved] = useState(false)
  const [authorStyles, setAuthorStyles] = useState<AuthorStyleOption[]>([])
  const [continuingFromId, setContinuingFromId] = useState<string | null>(null)
  const [seriesParts, setSeriesParts] = useState<SeriesPart[]>([])
  const [expandedPartId, setExpandedPartId] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('author_styles')
      .select('id, name, nationality, representative_works, tier')
      .order('name')
      .then(({ data }) => setAuthorStyles(data ?? []))
  }, [])

  const docType = watch('docType')
  const docCategory = docType ? DOC_TYPE_CATEGORY[docType] : undefined
  const selectedAuthorStyleId = watch('authorStyleId')
  const selectedAuthorStyle = authorStyles.find((style) => style.id === selectedAuthorStyleId)
  const developmentStructureKey = watch('developmentStructure')
  const selectedDevelopmentStructure = DEVELOPMENT_STRUCTURES.find(
    (structure) => structure.key === developmentStructureKey,
  )
  const imageUrls = watch('inputImageUrls')

  // author_style과 style_preset은 doc_type 카테고리에 따라 서로 배타적으로 노출되므로,
  // 카테고리가 바뀌면 반대쪽 필드는 즉시 비워서 숨겨진 값이 실수로 제출되지 않게 한다.
  useEffect(() => {
    if (!docCategory) return
    if (docCategory === 'practical') {
      setValue('authorStyleId', undefined)
    } else {
      setValue('stylePreset', undefined)
    }
  }, [docCategory, setValue])

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
          setUseCustomLanguage(false)
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
        'doc_type, style, tone, target_audience, length, language, author_style_id, style_preset, development_structure',
      )
      .eq('id', continueId)
      .single()
      .then(({ data }) => {
        if (data) {
          const language = data.language ?? 'ko'
          reset({
            inputText: '',
            docType: (data.doc_type ?? docTypeOptions[0].value) as GenerationFormValues['docType'],
            style: (data.style ?? styleOptions[0].value) as GenerationFormValues['style'],
            tone: (data.tone ?? toneOptions[0].value) as GenerationFormValues['tone'],
            targetAudience: (data.target_audience ??
              targetAudienceOptions[0].value) as GenerationFormValues['targetAudience'],
            length: (data.length ?? lengthOptions[0].value) as GenerationFormValues['length'],
            language,
            inputImageUrls: [],
            authorStyleId: data.author_style_id ?? undefined,
            stylePreset: (data.style_preset ?? undefined) as GenerationFormValues['stylePreset'],
            developmentStructure: (data.development_structure ??
              undefined) as GenerationFormValues['developmentStructure'],
            continueFromGenerationId: continueId,
          })
          setUseCustomLanguage(language !== 'ko' && language !== 'en')
          setContinuingFromId(continueId)
          loadSeriesParts(continueId).then(setSeriesParts)
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
      loadSeriesParts(generationId).then(setSeriesParts)
    }
  }, [status, generationId, continuingFromId, setValue])

  function handleCancelContinuation() {
    setContinuingFromId(null)
    setSeriesParts([])
    setExpandedPartId(null)
    setUseCustomLanguage(false)
    reset({
      inputText: '',
      inputImageUrls: [],
      authorStyleId: undefined,
      continueFromGenerationId: undefined,
    })
  }

  function handleToggleCustomLanguage() {
    setUseCustomLanguage((current) => !current)
    setValue('language', '')
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
          <div className="flex flex-col gap-2 rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink/70">
            <div className="flex items-center justify-between">
              <span>이전 글에 이어서 쓰는 중이에요</span>
              <button
                type="button"
                onClick={handleCancelContinuation}
                className="text-ink/50 hover:text-ink"
              >
                취소
              </button>
            </div>

            {seriesParts.length > 0 && (
              <div className="flex flex-col gap-1 border-t border-line pt-2">
                {seriesParts.map((part) => (
                  <div key={part.id}>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPartId((current) => (current === part.id ? null : part.id))
                      }
                      className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left text-ink/80 hover:bg-white hover:text-ink"
                    >
                      <span className="font-medium">{part.part_number ?? '?'}화</span>
                      <span className="text-xs text-ink/40">
                        {expandedPartId === part.id ? '접기' : '내용 보기'}
                      </span>
                    </button>
                    {expandedPartId === part.id && (
                      <p className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white px-3 py-2 text-xs text-ink/70">
                        {part.output_text}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
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
          render={({ field: urlsField }) => (
            <Controller
              control={control}
              name="imageMode"
              render={({ field: modeField }) => (
                <ImageUpload
                  value={urlsField.value}
                  onChange={urlsField.onChange}
                  mode={modeField.value ?? null}
                  onModeChange={modeField.onChange}
                  error={errors.imageMode?.message}
                />
              )}
            />
          )}
        />

        <Select
          label="글 종류"
          options={[...docTypeOptions]}
          error={errors.docType?.message}
          {...register('docType')}
        />

        <div className="flex flex-col gap-1.5">
          <Select
            label="전개 방식"
            options={DEVELOPMENT_STRUCTURES.map((structure) => ({
              value: structure.key,
              label: structure.label,
            }))}
            error={errors.developmentStructure?.message}
            {...register('developmentStructure')}
          />
          {selectedDevelopmentStructure && (
            <p className="text-xs text-ink/50">{selectedDevelopmentStructure.description}</p>
          )}
        </div>

        {docCategory === 'creative' && (
          <div className="flex flex-col gap-1.5">
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
            {selectedAuthorStyle?.tier === 'tier2' && (
              <p className="text-xs text-amber-600">
                이 작가는 데이터가 적어 문체 재현 정확도가 낮을 수 있습니다
              </p>
            )}
          </div>
        )}

        {docCategory === 'practical' && (
          <Select
            label="문체 프리셋 (선택)"
            placeholder="선택 안 함"
            options={[...stylePresetOptions]}
            error={errors.stylePreset?.message}
            {...register('stylePreset')}
          />
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-ink/80">언어</label>
              <button
                type="button"
                onClick={handleToggleCustomLanguage}
                className="text-xs text-ink/50 hover:text-ink"
              >
                {useCustomLanguage ? '목록에서 선택' : '직접 입력'}
              </button>
            </div>
            {useCustomLanguage ? (
              <input
                type="text"
                placeholder="예: 프랑스어, 베트남어, 스페인어"
                className="input"
                {...register('language')}
              />
            ) : (
              <select className="input" {...register('language')}>
                <option value="">선택해주세요</option>
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            {errors.language && <p className="text-sm text-red-600">{errors.language.message}</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={
            status === 'analyzing_image' ||
            status === 'streaming' ||
            (imageUrls.length > 0 && !watch('imageMode'))
          }
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
            {output && <StreamingPreview text={output} />}
            {status === 'done' && remainingCredits !== null && (
              <p className="mt-4 text-xs text-ink/50">남은 크레딧: {remainingCredits}</p>
            )}
          </div>
        )
      )}
    </div>
  )
}

// Re-parses the full accumulated text on every chunk (no partial-parse
// caching) so headings/paragraphs never render half-formed mid-stream.
function StreamingPreview({ text }: { text: string }) {
  return (
    <div className="prose prose-sm max-w-none leading-relaxed">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  )
}
