import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Select } from '@/components/Select'
import { TextArea } from '@/components/TextArea'
import { ImageUpload } from '@/components/ImageUpload'
import { useGeneration } from '@/hooks/useGeneration'
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

export function GenerationForm() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<GenerationFormValues>({
    resolver: zodResolver(generationFormSchema),
    defaultValues: { inputImageUrls: [] },
  })
  const { output, status, error, remainingCredits, generate } = useGeneration()

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <form
        onSubmit={handleSubmit(generate)}
        className="flex flex-col gap-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-semibold text-gray-900">글 생성하기</h1>
          <p className="mt-1 text-sm text-gray-500">
            주제와 원하는 스타일을 알려주시면 AI가 글을 완성해드려요.
          </p>
        </div>

        <TextArea
          label="주제 / 키워드"
          placeholder="예: 여름 휴가지로 제주도를 추천하는 이유"
          error={errors.inputText?.message}
          {...register('inputText')}
        />

        <Controller
          control={control}
          name="inputImageUrls"
          render={({ field }) => <ImageUpload value={field.value} onChange={field.onChange} />}
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
          className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
        >
          {status === 'analyzing_image'
            ? '사진 분석 중...'
            : status === 'streaming'
              ? '생성 중...'
              : '글 생성하기'}
        </button>
      </form>

      {(output || status === 'error' || status === 'analyzing_image') && (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {status === 'analyzing_image' && (
            <p className="text-sm text-gray-400">사진을 분석하고 있어요...</p>
          )}
          {output && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-900">{output}</p>
          )}
          {status === 'done' && remainingCredits !== null && (
            <p className="mt-4 text-xs text-gray-400">남은 크레딧: {remainingCredits}</p>
          )}
        </div>
      )}
    </div>
  )
}
