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
import { findDocTypeInfo, DEVELOPMENT_STRUCTURES, stylePresetOptions } from '@/lib/constants'
import {
  docTypeOptions,
  styleOptions,
  toneOptions,
  targetAudienceOptions,
  lengthOptions,
  languageOptions,
  outputFormatOptions,
  generationFormSchema,
  type GenerationFormValues,
} from '@/lib/generationSchema'

interface AuthorStyleOption {
  id: string
  name: string
  nationality: string | null
  representative_works: string | null
  tier: string
  style_keywords: string | null
  emotional_tone: string | null
  main_pov: string | null
  literary_traits: string | null
  representative_sentence: string | null
  target_genre: string | null
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
  const [showAdvanced, setShowAdvanced] = useState(false)
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
      .select(
        'id, name, nationality, representative_works, tier, style_keywords, emotional_tone, main_pov, literary_traits, representative_sentence, target_genre',
      )
      .order('name')
      .then(({ data }) => setAuthorStyles(data ?? []))
  }, [])

  const docType = watch('docType')
  const docTypeInfo = docType ? findDocTypeInfo(docType) : undefined
  const isLongForm = docTypeInfo?.longForm ?? false
  const selectedAuthorStyleId = watch('authorStyleId')
  const selectedAuthorStyle = authorStyles.find((style) => style.id === selectedAuthorStyleId)
  const developmentStructureKey = watch('developmentStructure')
  const selectedDevelopmentStructure = DEVELOPMENT_STRUCTURES.find(
    (structure) => structure.key === developmentStructureKey,
  )
  const imageUrls = watch('inputImageUrls')

  // author_style과 style_preset은 장문 문학 유형(수필/소설/희곡/시나리오/기행문) 여부에
  // 따라 서로 배타적으로 노출되므로, 전환되면 반대쪽 필드는 즉시 비워서 숨겨진 값이
  // 실수로 제출되지 않게 한다.
  useEffect(() => {
    if (isLongForm) {
      setValue('stylePreset', undefined)
    } else {
      setValue('authorStyleId', undefined)
    }
  }, [isLongForm, setValue])

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
            style: data.style ?? undefined,
            tone: data.tone ?? undefined,
            targetAudience: (data.target_audience ??
              targetAudienceOptions[0].value) as GenerationFormValues['targetAudience'],
            length: data.length ?? undefined,
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
        'doc_type, style, tone, target_audience, length, language, author_style_id, style_preset, development_structure, additional_instruction, seo_keywords, output_format',
      )
      .eq('id', continueId)
      .single()
      .then(({ data }) => {
        if (data) {
          const language = data.language ?? 'ko'
          reset({
            inputText: '',
            docType: (data.doc_type ?? docTypeOptions[0].value) as GenerationFormValues['docType'],
            style: data.style ?? undefined,
            tone: data.tone ?? undefined,
            targetAudience: (data.target_audience ??
              targetAudienceOptions[0].value) as GenerationFormValues['targetAudience'],
            length: data.length ?? undefined,
            language,
            inputImageUrls: [],
            authorStyleId: data.author_style_id ?? undefined,
            stylePreset: data.style_preset ?? undefined,
            developmentStructure: data.development_structure ?? undefined,
            additionalInstruction: data.additional_instruction ?? undefined,
            seoKeywords: data.seo_keywords?.length ? data.seo_keywords.join(', ') : undefined,
            outputFormat: data.output_format ?? undefined,
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
            주제, 글 종류, 타겟 독자만 알려주셔도 바로 생성할 수 있어요.
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

        {/* Step 1: 필수 입력 — 이것만 채워도 바로 생성 가능 */}
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Select
              label="글 종류"
              options={[...docTypeOptions]}
              error={errors.docType?.message}
              {...register('docType')}
            />
          </div>
          <Select
            label="타겟 독자"
            options={[...targetAudienceOptions]}
            error={errors.targetAudience?.message}
            {...register('targetAudience')}
          />
        </div>

        {docTypeInfo && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl border border-line bg-paper px-4 py-3 text-xs text-ink/70">
            <dt className="font-semibold text-ink/50">목적</dt>
            <dd>{docTypeInfo.purpose}</dd>
            <dt className="font-semibold text-ink/50">주요 특징</dt>
            <dd>{docTypeInfo.features}</dd>
            <dt className="font-semibold text-ink/50">대표 전개 방식</dt>
            <dd>{docTypeInfo.developmentStyle}</dd>
            <dt className="font-semibold text-ink/50">대표 예시</dt>
            <dd>{docTypeInfo.examples}</dd>
          </dl>
        )}

        <TextArea
          label="AI에게 추가 요청 (선택)"
          placeholder="예: 반말로 작성해줘 / SEO를 고려해줘 / 표를 넣어줘 / 사례를 포함해줘"
          rows={2}
          error={errors.additionalInstruction?.message}
          {...register('additionalInstruction')}
        />

        {/* Step 2: 고급 설정 — 기본은 접힘 */}
        <button
          type="button"
          onClick={() => setShowAdvanced((current) => !current)}
          className="flex items-center justify-between rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-ink/70 hover:bg-paper"
        >
          고급 설정
          <span className="text-ink/40">{showAdvanced ? '▲' : '▼'}</span>
        </button>

        {showAdvanced && (
          <div className="flex flex-col gap-4 rounded-xl border border-line bg-paper p-4">
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

            <div className="flex flex-col gap-1.5">
              <Select
                label="전개 방식 (선택)"
                placeholder="선택 안 함"
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

            {isLongForm && (
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
                {selectedAuthorStyle && (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-xl border border-line bg-white px-4 py-3 text-xs text-ink/70">
                    {selectedAuthorStyle.style_keywords && (
                      <>
                        <dt className="font-semibold text-ink/50">문체 핵심 키워드</dt>
                        <dd>{selectedAuthorStyle.style_keywords}</dd>
                      </>
                    )}
                    {selectedAuthorStyle.emotional_tone && (
                      <>
                        <dt className="font-semibold text-ink/50">감성 톤</dt>
                        <dd>{selectedAuthorStyle.emotional_tone}</dd>
                      </>
                    )}
                    {selectedAuthorStyle.main_pov && (
                      <>
                        <dt className="font-semibold text-ink/50">주요 시점</dt>
                        <dd>{selectedAuthorStyle.main_pov}</dd>
                      </>
                    )}
                    {selectedAuthorStyle.literary_traits && (
                      <>
                        <dt className="font-semibold text-ink/50">문학적 특징</dt>
                        <dd className="col-span-2">{selectedAuthorStyle.literary_traits}</dd>
                      </>
                    )}
                    {selectedAuthorStyle.representative_sentence && (
                      <>
                        <dt className="font-semibold text-ink/50">대표 문장</dt>
                        <dd className="col-span-2 whitespace-pre-line">
                          {selectedAuthorStyle.representative_sentence}
                        </dd>
                      </>
                    )}
                    {selectedAuthorStyle.target_genre && (
                      <>
                        <dt className="font-semibold text-ink/50">주요 대상 장르</dt>
                        <dd>{selectedAuthorStyle.target_genre}</dd>
                      </>
                    )}
                  </dl>
                )}
              </div>
            )}

            {!isLongForm && (
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
                label="스타일 (선택)"
                placeholder="선택 안 함"
                options={[...styleOptions]}
                error={errors.style?.message}
                {...register('style')}
              />
              <Select
                label="톤 (선택)"
                placeholder="선택 안 함"
                options={[...toneOptions]}
                error={errors.tone?.message}
                {...register('tone')}
              />
              <Select
                label="분량 (선택)"
                placeholder="선택 안 함"
                options={[...lengthOptions]}
                error={errors.length?.message}
                {...register('length')}
              />
              <Select
                label="출력 형식 (선택)"
                placeholder="마크다운 (기본)"
                options={[...outputFormatOptions]}
                error={errors.outputFormat?.message}
                {...register('outputFormat')}
              />
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-ink/80">언어 (선택)</label>
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
                    <option value="">선택 안 함 (기본 한국어)</option>
                    {languageOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                {errors.language && (
                  <p className="text-sm text-red-600">{errors.language.message}</p>
                )}
              </div>
            </div>

            <input
              type="text"
              placeholder="SEO 키워드 (쉼표로 구분, 선택)"
              className="input"
              {...register('seoKeywords')}
            />
            {errors.seoKeywords && (
              <p className="text-sm text-red-600">{errors.seoKeywords.message}</p>
            )}
          </div>
        )}

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
