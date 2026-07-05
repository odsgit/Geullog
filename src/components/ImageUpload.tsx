import { useState, type ChangeEvent } from 'react'
import { supabase } from '@/lib/supabase'

const MAX_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

type ImageMode = 'ocr' | 'describe'

interface ImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  mode: ImageMode | null
  onModeChange: (mode: ImageMode) => void
  error?: string
}

const modeOptions: { value: ImageMode; label: string }[] = [
  { value: 'ocr', label: '① 사진 속 글자 읽기' },
  { value: 'describe', label: '② 사진 분위기·내용 묘사' },
]

export function ImageUpload({ value, onChange, mode, onModeChange, error }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploadError(null)

    if (file.size > MAX_SIZE_BYTES) {
      setUploadError('파일 크기는 5MB 이하만 업로드할 수 있습니다')
      return
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUploadError('jpg, png, webp 형식만 업로드할 수 있습니다')
      return
    }

    setUploading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setUploadError('로그인이 필요합니다')
        return
      }

      const path = `${user.id}/${crypto.randomUUID()}.${EXTENSION_BY_TYPE[file.type]}`

      const { error: uploadStorageError } = await supabase.storage
        .from('user-uploads')
        .upload(path, file, { contentType: file.type })

      if (uploadStorageError) {
        setUploadError('업로드에 실패했습니다')
        return
      }

      const { data: signedData, error: signedError } = await supabase.storage
        .from('user-uploads')
        .createSignedUrl(path, 60 * 60)

      if (signedError || !signedData) {
        setUploadError('이미지 URL 생성에 실패했습니다')
        return
      }

      onChange([...value, signedData.signedUrl])
    } finally {
      setUploading(false)
    }
  }

  function handleRemove(url: string) {
    onChange(value.filter((existing) => existing !== url))
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-ink/80">사진 첨부 (선택)</label>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={uploading}
        className="text-sm text-ink/60 file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-accent-dark"
      />
      {uploading && <p className="text-sm text-ink/50">업로드 중...</p>}
      {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
      {value.length > 0 && (
        <div className="mt-2 flex gap-2">
          {value.map((url) => (
            <div key={url} className="relative">
              <img
                src={url}
                alt="첨부 이미지"
                className="h-20 w-20 rounded-xl border border-line object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(url)}
                className="absolute -top-2 -right-2 rounded-full bg-accent px-1.5 py-0.5 text-xs font-semibold text-white shadow-sm"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      {value.length > 0 && (
        <div className="mt-2 flex flex-col gap-1.5 rounded-xl border border-line bg-paper px-3 py-2.5">
          <p className="text-xs font-semibold text-ink/70">사진을 어떻게 활용할까요?</p>
          <div className="flex flex-col gap-1">
            {modeOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm text-ink/80">
                <input
                  type="radio"
                  name="image-mode"
                  value={option.value}
                  checked={mode === option.value}
                  onChange={() => onModeChange(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  )
}
