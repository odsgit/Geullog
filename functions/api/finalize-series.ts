import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { resolveOpenAiApiKey } from '../_lib/apiKey'

interface Env {
  OPENAI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

const requestSchema = z.object({ generationId: z.string() })

interface FinalizedSection {
  subtitle: string
  content: string
}

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

  const { data: profile } = await supabase.from('profiles').select('credits').single()
  if (!profile || profile.credits < 1) {
    return Response.json({ error: 'insufficient_credits' }, { status: 402 })
  }

  const { data: sourceGeneration, error: sourceError } = await supabase
    .from('generations')
    .select('id, series_id, part_number, output_text')
    .eq('id', parsed.data.generationId)
    .single()

  if (sourceError || !sourceGeneration) {
    return Response.json({ error: 'not_found' }, { status: 404 })
  }

  // 아직 시리즈가 만들어지지 않은 최초 이어쓰기 시점(series_id가 null)에는 이 글 하나만
  // 대상으로 삼는다 — GenerationForm의 이전 파트 목록 로직과 동일한 폴백 패턴.
  const partsSource = sourceGeneration.series_id
    ? await supabase
        .from('generations')
        .select('id, part_number, output_text')
        .eq('series_id', sourceGeneration.series_id)
        .order('part_number', { ascending: true })
    : { data: [sourceGeneration] }

  const parts = await Promise.all(
    (partsSource.data ?? []).map(async (part) => {
      const { data: latestVersion } = await supabase
        .from('generation_versions')
        .select('output_text')
        .eq('generation_id', part.id)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle()

      return {
        partNumber: part.part_number ?? 1,
        text: latestVersion?.output_text ?? part.output_text ?? '',
      }
    }),
  )

  const combinedText = parts
    .map((part) => `[${part.partNumber}화]\n${part.text}`)
    .join('\n\n')

  const openai = new OpenAI({ apiKey: keyResult.apiKey })

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          '당신은 편집자입니다. 사용자가 이어쓰기로 완성한 글 전체를 받아 다음 JSON 형식으로만 ' +
          '응답하세요: {"title": "전체 글에 어울리는 제목", "sections": [{"subtitle": "이 부분의 ' +
          '맥락에 맞는 소제목", "content": "해당 부분 내용"}]}. 전체 내용을 글의 전개 흐름에 따라 ' +
          '자연스러운 의미 단위 여러 개로 나누고 각 단위에 맥락에 맞는 소제목을 붙이세요. ' +
          '원문의 문장과 내용은 요약하거나 바꾸지 말고 그대로 유지하되, 문단 구분과 소제목만 ' +
          '새로 정리해서 추가하세요.',
      },
      { role: 'user', content: combinedText },
    ],
  })

  const raw = response.choices[0]?.message?.content ?? '{}'
  let parsedResult: { title?: string; sections?: FinalizedSection[] }
  try {
    parsedResult = JSON.parse(raw)
  } catch {
    return Response.json({ error: 'finalize_parse_failed' }, { status: 502 })
  }

  if (!parsedResult.title || !parsedResult.sections?.length) {
    return Response.json({ error: 'finalize_parse_failed' }, { status: 502 })
  }

  const tokensUsed = response.usage?.total_tokens ?? 0

  const { data: charged, error: chargeError } = await supabase.rpc('charge_series_finalize', {
    p_generation_id: parsed.data.generationId,
    p_tokens_used: tokensUsed,
  })

  if (chargeError) {
    return Response.json({ error: chargeError.message }, { status: 402 })
  }

  const result = Array.isArray(charged) ? charged[0] : charged

  return Response.json({
    title: parsedResult.title,
    sections: parsedResult.sections,
    remainingCredits: result?.remaining_credits ?? null,
  })
}
