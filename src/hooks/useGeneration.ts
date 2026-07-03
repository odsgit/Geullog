import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { GenerationFormValues } from '@/lib/generationSchema'

type Status = 'idle' | 'streaming' | 'done' | 'error'

interface StreamEvent {
  delta?: string
  done?: boolean
  remainingCredits?: number
  error?: string
}

export function useGeneration() {
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [remainingCredits, setRemainingCredits] = useState<number | null>(null)

  async function generate(values: GenerationFormValues) {
    setOutput('')
    setError(null)
    setStatus('streaming')

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setError('로그인이 필요합니다')
      setStatus('error')
      return
    }

    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(values),
    })

    if (!res.ok || !res.body) {
      if (res.status === 402) {
        setError('크레딧이 부족합니다')
      } else {
        const body = await res.json().catch(() => null)
        setError(body?.error ?? `요청에 실패했습니다 (${res.status})`)
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

        if (payload.delta) {
          setOutput((prev) => prev + payload.delta)
        }
        if (payload.error) {
          setError(payload.error)
          setStatus('error')
        }
        if (payload.done) {
          setRemainingCredits(payload.remainingCredits ?? null)
        }
      }
    }

    setStatus((current) => (current === 'error' ? current : 'done'))
  }

  return { output, status, error, remainingCredits, generate }
}
