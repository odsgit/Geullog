import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

interface Env {
  OPENAI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

const requestSchema = z.object({ generationId: z.string() })

// 이어쓰기 직전까지의 내용을 근거로 "다음 내용 지시"에 바로 쓸 수 있는 3개의 제안을
// 만들어준다. 실제 새 글을 생성하는 액션이 아니라 다음에 뭘 쓸지 고르는 걸 도와주는
// 가벼운 보조 기능이라 크레딧을 차감하지 않는다.
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

  const body = await context.request.json()
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const { data: sourceGeneration, error: sourceError } = await supabase
    .from('generations')
    .select('id, series_id, part_number, output_text')
    .eq('id', parsed.data.generationId)
    .single()

  if (sourceError || !sourceGeneration) {
    return Response.json({ error: 'not_found' }, { status: 404 })
  }

  const { data: latestVersion } = await supabase
    .from('generation_versions')
    .select('output_text')
    .eq('generation_id', sourceGeneration.id)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const latestPartNumber = sourceGeneration.series_id
    ? (
        await supabase
          .from('generations')
          .select('part_number')
          .eq('series_id', sourceGeneration.series_id)
          .order('part_number', { ascending: false })
          .limit(1)
          .maybeSingle()
      ).data?.part_number
    : sourceGeneration.part_number

  const previousText = latestVersion?.output_text ?? sourceGeneration.output_text ?? ''
  const context_ = previousText.length > 4000 ? previousText.slice(-4000) : previousText

  const openai = new OpenAI({ apiKey: context.env.OPENAI_API_KEY })

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          '당신은 이야기 편집자입니다. 사용자가 지금까지 쓴 글의 마지막 부분을 보고, 다음 화에서 ' +
          '이어갈 수 있는 전개 방향을 3가지 제안하세요. 각 제안은 사용자가 "다음 내용 지시" 입력창에 ' +
          '그대로 붙여넣어 바로 사용할 수 있도록, 이미 등장한 인물/설정/사건을 반영한 구체적인 한두 ' +
          '문장의 지시문 형태로 작성하세요(예: "주인공이 폐허에서 새로운 단서를 발견하는 장면을 ' +
          '이어서 써주세요"). 서로 다른 방향(갈등 심화, 새로운 인물 등장, 반전 등)을 제안하세요. ' +
          '다음 JSON 형식으로만 응답하세요: {"suggestions": ["...", "...", "..."]}',
      },
      {
        role: 'user',
        content: `[${latestPartNumber ?? 1}화까지의 마지막 부분]\n${context_}`,
      },
    ],
  })

  const raw = response.choices[0]?.message?.content ?? '{}'
  let parsedResult: { suggestions?: string[] }
  try {
    parsedResult = JSON.parse(raw)
  } catch {
    return Response.json({ error: 'suggestion_parse_failed' }, { status: 502 })
  }

  return Response.json({ suggestions: parsedResult.suggestions ?? [] })
}
