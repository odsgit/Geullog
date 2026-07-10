import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { resolveOpenAiApiKey } from '../_lib/apiKey'

interface Env {
  OPENAI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

const requestSchema = z.object({ inputText: z.string().trim().min(1) })

// 사용자가 입력한 대략적인 주제/키워드를 더 구체적이고 명확한 형태로 다듬어준다. 실제
// 글을 생성하는 액션이 아니라 입력을 도와주는 가벼운 보조 기능이라 크레딧을 차감하지 않는다.
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const authHeader = context.request.headers.get('Authorization')
  if (!authHeader) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token)

  if (userError || !user) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const keyResult = await resolveOpenAiApiKey(supabase, user, context.env.OPENAI_API_KEY)
  if (!keyResult.ok) return keyResult.response

  const body = await context.request.json()
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const openai = new OpenAI({ apiKey: keyResult.apiKey })

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          '당신은 글쓰기 편집자입니다. 사용자가 입력한 대략적인 주제나 키워드를 보고, 글의 방향이 ' +
          '명확히 드러나도록 더 구체적이고 매력적인 주제/키워드 하나로 다듬어 제안하세요. 원래 의도는 ' +
          '유지하되 막연한 표현은 구체화하세요. 다음 JSON 형식으로만 응답하세요: {"topic": "..."}',
      },
      {
        role: 'user',
        content: parsed.data.inputText,
      },
    ],
  })

  const raw = response.choices[0]?.message?.content ?? '{}'
  let parsedResult: { topic?: string }
  try {
    parsedResult = JSON.parse(raw)
  } catch {
    return Response.json({ error: 'suggestion_parse_failed' }, { status: 502 })
  }

  return Response.json({ topic: parsedResult.topic ?? '' })
}
