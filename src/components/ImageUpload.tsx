import { useState, type ChangeEvent } from 'react'
import { supabase } from '@/lib/supabase'

const MAX_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

interface ImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError(null)

    if (file.size > MAX_SIZE_BYTES) {
      setError('파일 크기는 5MB 이하만 업로드할 수 있습니다')
      return
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('jpg, png, webp 형식만 업로드할 수 있습니다')
      return
    }

    setUploading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError('로그인이 필요합니다')
        return
      }

      const path = `${user.id}/${crypto.randomUUID()}.${EXTENSION_BY_TYPE[file.type]}`

      const { error: uploadError } = await supabase.storage
        .from('user-uploads')
        .upload(path, file, { contentType: file.type })

      if (uploadError) {
        setError('업로드에 실패했습니다')
        return
      }

      const { data: signedData, error: signedError } = await supabase.storage
        .from('user-uploads')
        .createSignedUrl(path, 60 * 60)

      if (signedError || !signedData) {
        setError('이미지 URL 생성에 실패했습니다')
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
      {error && <p className="text-sm text-red-600">{error}</p>}
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
    </div>
  )
}
