export const CONTINUE_STORAGE_KEY = 'geullog_continue_from_generation_id'

export interface ContinuePayload {
  generationId: string
  /** 서사형 전개 방식을 단계별로 이어 쓸 때, 다음에 써야 할 단계의 0-based 인덱스. */
  stepIndex?: number
}

export function writeContinuePayload(payload: ContinuePayload) {
  localStorage.setItem(CONTINUE_STORAGE_KEY, JSON.stringify(payload))
}

// 예전 버전은 CONTINUE_STORAGE_KEY에 순수 generationId 문자열만 저장했다 — JSON 파싱이
// 실패하면 그 값 자체를 generationId로 취급해 하위 호환을 유지한다.
export function readContinuePayload(): ContinuePayload | null {
  const raw = localStorage.getItem(CONTINUE_STORAGE_KEY)
  if (!raw) return null

  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.generationId === 'string') {
      return parsed as ContinuePayload
    }
  } catch {
    // not JSON — fall through to legacy plain-string handling
  }

  return { generationId: raw }
}
