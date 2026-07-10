import { useEffect, useState, type ChangeEvent } from 'react'
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
import { CONTINUE_STORAGE_KEY, readContinuePayload } from '@/lib/continuationStorage'
import { exportStructuredDocx } from '@/lib/export'
import {
  findDocTypeInfo,
  findLengthOption,
  findDevelopmentStructure,
  findNovelGenre,
  DEVELOPMENT_STRUCTURES,
  DOC_TYPE_CATEGORIES,
  NOVEL_GENRES,
  stylePresetOptions,
} from '@/lib/constants'
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
  const [finalizing, setFinalizing] = useState(false)
  const [finalizeError, setFinalizeError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [docTypeCategory, setDocTypeCategory] = useState<'general' | 'practical'>('general')
  const [topicGenerating, setTopicGenerating] = useState(false)
  const [titleGenerating, setTitleGenerating] = useState(false)
  // 서사형 전개 방식(기승전결/소설5단/영웅의여정 등)을 단계별로 순차 생성할 때, 지금까지
  // 이 시리즈에서 몇 번째 단계까지 썼는지 추적한다. 실용형 구조(3단구성 등)는 여전히
  // 전체를 한 번에 생성하므로 이 값을 쓰지 않는다.
  const [structureStepIndex, setStructureStepIndex] = useState(0)
  const [isStructureContinuation, setIsStructureContinuation] = useState(false)
  const [stepTitle, setStepTitle] = useState<string | null>(null)

  // 사용자가 입력한 대략적인 주제/키워드를 AI가 더 구체적인 형태로 다듬어서 같은
  // 입력창에 채워 넣는다. 사용자는 결과를 그대로 쓰거나 직접 다시 수정할 수 있다.
  async function handleGenerateTopic() {
    const inputText = getValues('inputText').trim()
    if (!inputText) return

    setTopicGenerating(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setTopicGenerating(false)
      return
    }

    const res = await fetch('/api/suggest-topic', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ inputText }),
    })

    setTopicGenerating(false)
    if (!res.ok) return

    const { topic } = await res.json()
    if (topic) setValue('inputText', topic)
  }

  // 확정된 주제/키워드를 근거로 제목을 하나 생성해 제목 입력창에 채워 넣는다. 마음에
  // 들지 않으면 다시 눌러 재생성하거나 직접 수정할 수 있다.
  async function handleGenerateTitle() {
    const topic = getValues('inputText').trim()
    if (!topic) return

    setTitleGenerating(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setTitleGenerating(false)
      return
    }

    const res = await fetch('/api/suggest-title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ topic, docType: getValues('docType') || undefined }),
    })

    setTitleGenerating(false)
    if (!res.ok) return

    const { title } = await res.json()
    if (title) setValue('title', title)
  }

  async function loadSuggestions(seedGenerationId: string) {
    setSuggestionsLoading(true)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setSuggestionsLoading(false)
      return
    }

    const res = await fetch('/api/suggest-continuation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ generationId: seedGenerationId }),
    })

    setSuggestionsLoading(false)
    if (!res.ok) return

    const { suggestions: nextSuggestions } = await res.json()
    setSuggestions(nextSuggestions ?? [])
  }

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
  const recommendedLengthOption = docTypeInfo ? findLengthOption(docTypeInfo.recommendedLength) : undefined
  const filteredDocTypeOptions = docTypeOptions.filter(
    (option) => findDocTypeInfo(option.value)?.category === docTypeCategory,
  )

  // 템플릿/이어쓰기로 불러온 docType이 있으면 카테고리 버튼도 그 값을 따라간다.
  useEffect(() => {
    if (docType) {
      const info = findDocTypeInfo(docType)
      if (info) setDocTypeCategory(info.category)
    }
  }, [docType])

  // 카테고리를 바꾸면 목록이 완전히 달라지므로, 지금 선택된 글 종류가 새 카테고리에 없으면
  // 비워서 사용자가 새 목록에서 다시 고르게 한다.
  function handleSelectCategory(category: 'general' | 'practical') {
    if (category === docTypeCategory) return
    setDocTypeCategory(category)
    if (findDocTypeInfo(docType)?.category !== category) {
      setValue('docType', '' as GenerationFormValues['docType'])
    }
  }
  const selectedAuthorStyleId = watch('authorStyleId')
  const selectedAuthorStyle = authorStyles.find((style) => style.id === selectedAuthorStyleId)
  const developmentStructureKey = watch('developmentStructure')
  const selectedDevelopmentStructure = DEVELOPMENT_STRUCTURES.find(
    (structure) => structure.key === developmentStructureKey,
  )
  const isNarrativeStructure = selectedDevelopmentStructure ? !selectedDevelopmentStructure.practical : false
  const novelGenreValue = watch('novelGenre')
  const selectedNovelGenre = novelGenreValue ? findNovelGenre(novelGenreValue) : undefined
  const imageUrls = watch('inputImageUrls')

  // 소설이 아닌 글 종류로 바꾸면 남아있던 소설 장르 선택은 의미가 없으니 비운다.
  useEffect(() => {
    if (docType !== 'novel') {
      setValue('novelGenre', undefined)
    }
  }, [docType, setValue])

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
    const payload = readContinuePayload()
    if (!payload) return
    const { generationId: continueId, stepIndex } = payload

    supabase
      .from('generations')
      .select(
        'input_text, doc_type, style, tone, target_audience, length, language, author_style_id, style_preset, development_structure, additional_instruction, seo_keywords, output_format',
      )
      .eq('id', continueId)
      .single()
      .then(({ data }) => {
        if (data) {
          const language = data.language ?? 'ko'
          const structure = data.development_structure
            ? findDevelopmentStructure(data.development_structure)
            : undefined
          // stepIndex는 "다음 단계 쓰기" 버튼을 눌렀을 때만 온다 — 그 경우 원래 주제는
          // 그대로 이어받고, 자유 입력 대신 정해진 다음 단계를 자동으로 지정한다.
          const nextStep = stepIndex !== undefined && structure ? structure.structureSteps[stepIndex] : undefined
          const structureContinuation = nextStep !== undefined

          reset({
            inputText: structureContinuation ? (data.input_text ?? '') : '',
            title: undefined,
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
            developmentStep: nextStep,
            additionalInstruction: data.additional_instruction ?? undefined,
            seoKeywords: data.seo_keywords?.length ? data.seo_keywords.join(', ') : undefined,
            outputFormat: data.output_format ?? undefined,
            continueFromGenerationId: continueId,
          })
          setUseCustomLanguage(language !== 'ko' && language !== 'en')
          setContinuingFromId(continueId)
          setIsStructureContinuation(structureContinuation)
          loadSeriesParts(continueId).then(setSeriesParts)
          if (structureContinuation && stepIndex !== undefined) {
            setStructureStepIndex(stepIndex)
          } else {
            loadSuggestions(continueId)
          }
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
      loadSuggestions(generationId)
    }
  }, [status, generationId, continuingFromId, setValue])

  useEffect(() => {
    if (status === 'streaming') setStepTitle(null)
  }, [status])

  // 전개 방식(영웅의 여정 등 서사형 구조)으로 쓴 단계는 그 단계 본문 내용을 바탕으로 제목을
  // 자동으로 지어 붙인다. 실용형 구조는 단계 개념이 없어 제목을 짓지 않는다.
  useEffect(() => {
    if (status !== 'done' || !generationId || !isNarrativeStructure || !output) return

    const currentGenerationId = generationId
    let cancelled = false

    async function generateStepTitle() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session || cancelled) return

      const res = await fetch('/api/suggest-title-from-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ content: output, docType: getValues('docType') || undefined }),
      })
      if (!res.ok || cancelled) return

      const { title } = await res.json()
      if (!title || cancelled) return

      await supabase.from('generations').update({ title }).eq('id', currentGenerationId)
      if (!cancelled) setStepTitle(title)
    }

    generateStepTitle()
    return () => {
      cancelled = true
    }
  }, [status, generationId, isNarrativeStructure, output, getValues])

  function handleCancelContinuation() {
    setContinuingFromId(null)
    setSeriesParts([])
    setExpandedPartId(null)
    setSuggestions([])
    setUseCustomLanguage(false)
    setIsStructureContinuation(false)
    setStructureStepIndex(0)
    reset({
      inputText: '',
      title: undefined,
      inputImageUrls: [],
      authorStyleId: undefined,
      developmentStep: undefined,
      continueFromGenerationId: undefined,
    })
  }

  // "이어서 쓰기 그만하기": 지금까지 이어쓴 파트 전체를 AI로 정리(전체 제목 + 문단 흐름에
  // 맞는 소제목)해서 .docx로 내려받고, 이어쓰기 모드를 종료한다.
  async function handleFinalizeSeries() {
    if (!continuingFromId) return
    setFinalizing(true)
    setFinalizeError(null)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setFinalizeError('로그인이 필요합니다')
      setFinalizing(false)
      return
    }

    const res = await fetch('/api/finalize-series', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ generationId: continuingFromId }),
    })

    if (!res.ok) {
      if (res.status === 402) {
        setFinalizeError('크레딧이 부족합니다')
      } else {
        const responseBody = await res.json().catch(() => null)
        setFinalizeError(responseBody?.error ?? `요청에 실패했습니다 (${res.status})`)
      }
      setFinalizing(false)
      return
    }

    const { title, sections } = await res.json()
    await exportStructuredDocx(title || 'geullog-series', title || '제목 없음', sections ?? [])
    setFinalizing(false)
    handleCancelContinuation()
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
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleFinalizeSeries}
                  disabled={finalizing}
                  className="text-ink/50 hover:text-ink"
                >
                  {finalizing ? '정리하는 중...' : '이어서 쓰기 그만하기'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelContinuation}
                  className="text-ink/50 hover:text-ink"
                >
                  취소
                </button>
              </div>
            </div>

            {finalizeError && <p className="text-xs text-red-600">{finalizeError}</p>}

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
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="inputText" className="text-sm font-semibold text-ink/80">
              {continuingFromId && !isStructureContinuation ? '다음 내용 지시' : '주제 / 키워드'}
            </label>
            {!continuingFromId && (
              <button
                type="button"
                onClick={handleGenerateTopic}
                disabled={topicGenerating || !watch('inputText')?.trim()}
                className="btn-sm"
              >
                {topicGenerating ? '생성 중...' : 'AI로 다듬기'}
              </button>
            )}
          </div>
          <textarea
            id="inputText"
            rows={4}
            placeholder={
              continuingFromId
                ? '예: 이제 주인공이 마을을 떠나는 장면을 이어서 써주세요'
                : '예: 여름 휴가지로 제주도를 추천하는 이유'
            }
            className={`input resize-y ${errors.inputText ? 'border-red-400' : ''}`}
            {...register('inputText')}
          />
          {errors.inputText && <p className="text-sm text-red-600">{errors.inputText.message}</p>}
          {isStructureContinuation && watch('developmentStep') && (
            <p className="text-xs text-ink/50">
              이번에는 <strong className="text-ink/80">{watch('developmentStep')}</strong> 단계를
              작성합니다.
            </p>
          )}
        </div>

        {!continuingFromId && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="title" className="text-sm font-semibold text-ink/80">
                제목 (선택)
              </label>
              <button
                type="button"
                onClick={handleGenerateTitle}
                disabled={titleGenerating || !watch('inputText')?.trim()}
                className="btn-sm"
              >
                {titleGenerating ? '생성 중...' : watch('title') ? '다시 생성' : '제목 생성'}
              </button>
            </div>
            <input
              id="title"
              type="text"
              placeholder="주제/키워드를 정한 뒤 생성 버튼을 눌러보세요"
              className={`input ${errors.title ? 'border-red-400' : ''}`}
              {...register('title')}
            />
            {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
          </div>
        )}

        {continuingFromId && !isStructureContinuation && (suggestionsLoading || suggestions.length > 0) && (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink/50">
              {suggestionsLoading ? '다음 내용을 추천하고 있어요...' : '이런 방향은 어떨까요?'}
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setValue('inputText', suggestion)}
                  className="badge text-left hover:bg-paper"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-ink/80">글 종류</label>
          <div className="flex gap-2">
            {DOC_TYPE_CATEGORIES.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => handleSelectCategory(category.value)}
                className={
                  docTypeCategory === category.value
                    ? 'flex-1 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-dark'
                    : 'flex-1 rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-ink/60 transition-colors hover:bg-paper'
                }
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Select
              label={`${DOC_TYPE_CATEGORIES.find((category) => category.value === docTypeCategory)?.label} 목록`}
              options={filteredDocTypeOptions}
              error={errors.docType?.message}
              {...register('docType', {
                onChange: (event: ChangeEvent<HTMLSelectElement>) => {
                  const info = findDocTypeInfo(event.target.value)
                  if (info) setValue('length', info.recommendedLength)
                },
              })}
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
            {recommendedLengthOption && (
              <>
                <dt className="font-semibold text-ink/50">추천 분량</dt>
                <dd>
                  {recommendedLengthOption.label} ({recommendedLengthOption.charRange})
                </dd>
              </>
            )}
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

            {docType === 'novel' && (
              <div className="flex flex-col gap-1.5">
                <Select
                  label="소설 장르 (선택)"
                  placeholder="선택 안 함"
                  options={NOVEL_GENRES.flatMap((group) =>
                    group.genres.map((genre) => ({
                      value: genre.value,
                      label: `[${group.category}] ${genre.label}`,
                    })),
                  )}
                  error={errors.novelGenre?.message}
                  {...register('novelGenre')}
                />
                {selectedNovelGenre && (
                  <p className="text-xs text-ink/50">{selectedNovelGenre.description}</p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Select
                label="전개 방식 (선택)"
                placeholder="선택 안 함"
                options={DEVELOPMENT_STRUCTURES.map((structure) => ({
                  value: structure.key,
                  label: structure.label,
                }))}
                error={errors.developmentStructure?.message}
                {...register('developmentStructure', {
                  onChange: (event: ChangeEvent<HTMLSelectElement>) => {
                    const structure = findDevelopmentStructure(event.target.value)
                    if (structure && !structure.practical) {
                      setValue('developmentStep', structure.structureSteps[0])
                    } else {
                      setValue('developmentStep', undefined)
                    }
                    setStructureStepIndex(0)
                  },
                })}
              />
              {selectedDevelopmentStructure && (
                <p className="text-xs text-ink/50">{selectedDevelopmentStructure.description}</p>
              )}
              {isNarrativeStructure && !continuingFromId && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink/50">
                    먼저 작성할 단계를 골라주세요
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedDevelopmentStructure!.structureSteps.map((step, index) => (
                      <button
                        key={step}
                        type="button"
                        onClick={() => {
                          setValue('developmentStep', step)
                          setStructureStepIndex(index)
                        }}
                        className={
                          watch('developmentStep') === step
                            ? 'rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white'
                            : 'rounded-full border border-line bg-white px-3 py-1 text-xs text-ink/60 hover:bg-paper'
                        }
                      >
                        {step}
                      </button>
                    ))}
                  </div>
                </div>
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
              : isStructureContinuation && watch('developmentStep')
                ? `${watch('developmentStep')} 쓰기`
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
          <GenerationResult
            key={generationId}
            generationId={generationId}
            initialText={output}
            developmentStructureKey={isNarrativeStructure ? selectedDevelopmentStructure?.key : undefined}
            stepIndex={isNarrativeStructure ? structureStepIndex : undefined}
            title={isNarrativeStructure ? (stepTitle ?? undefined) : undefined}
          />
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
