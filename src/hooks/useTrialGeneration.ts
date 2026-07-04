import { useState } from 'react'
import type { GenerationFormValues } from '@/lib/generationSchema'

type Status = 'idle' | 'streaming' | 'done' | 'error'

interface StreamEvent {
  delta?: string
  done?: boolean
  error?: string
}

export function useTrialGeneration() {
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  async function generate(values: GenerationFormValues) {
    setOutput('')
    setError(null)
    setStatus('streaming')

    const res = await fetch('/api/trial-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })

    if (!res.ok || !res.body) {
      if (res.status === 429) {
        setError('이미 무료 체험을 사용하셨어요. 가입하고 계속 이용해보세요.')
      } else {
        const responseBody = await res.json().catch(() => null)
        setError(responseBody?.error ?? `요청에 실패했습니다 (${res.status})`)
      }
      setStatus('error')
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split('\n\n')
      buffer = events.pop() ?? ''

      for (const line of events) {
        if (!line.startsWith('data: ')) continue
        const payload: StreamEvent = JSON.parse(line.slice('data: '.length))

        if (payload.delta) setOutput((prev) => prev + payload.delta)
        if (payload.error) {
          setError(payload.error)
          setStatus('error')
        }
      }
    }

    setStatus((current) => (current === 'error' ? current : 'done'))
  }

  return { output, status, error, generate }
}
