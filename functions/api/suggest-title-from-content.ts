import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { resolveOpenAiApiKey } from '../_lib/apiKey'

interface Env {
  OPENAI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

const requestSchema = z.object({
  content: z.string().trim().min(1),
  docType: z.string().trim().optional(),
})

// suggest-title.ts는 생성 전 주제/키워드를 근거로 제목을 짓지만, 이건 생성이 끝난 뒤 실제
// 본문 내용을 근거로 제목을 짓는다. 전개 방식(영웅의 여정 등) 단계별 생성처럼 결과가 나오기
// 전엔 그 단계의 내용을 알 수 없는 흐름에서 쓴다. 마찬가지로 보조 기능이라 크레딧을
// 차감하지 않는다.
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

  const docTypeLine = parsed.data.docType ? `\n[글 종류]\n${parsed.data.docType}` : ''
  const excerpt = parsed.data.content.slice(0, 6000)

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          '당신은 카피라이터입니다. 주어진 글의 내용을 근거로 독자의 흥미를 끄는 제목을 하나 ' +
          '제안하세요. 제목은 20자 내외로 간결하되 핵심 내용이 드러나야 합니다. 다음 JSON 형식으로만 ' +
          '응답하세요: {"title": "..."}',
      },
      {
        role: 'user',
        content: `[글 내용]\n${excerpt}${docTypeLine}`,
      },
    ],
  })

  const raw = response.choices[0]?.message?.content ?? '{}'
  let parsedResult: { title?: string }
  try {
    parsedResult = JSON.parse(raw)
  } catch {
    return Response.json({ error: 'suggestion_parse_failed' }, { status: 502 })
  }

  return Response.json({ title: parsedResult.title ?? '' })
}
