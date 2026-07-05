import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { generationFormSchema } from '../../src/lib/generationSchema'
import { buildPrompt } from '../../src/lib/promptTemplates'

interface Env {
  OPENAI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

// STEP E 완료 기준 모니터링용: 재시도는 하지 않고 로그만 남긴다(Cloudflare Pages
// Functions 로그에서 확인). 마크다운 구조 강제 프롬프트가 실제로 문단 구분을
// 만들어내고 있는지 관찰하기 위한 용도.
function logStructureIntegrity(text: string) {
  if (!text.includes('\n\n')) {
    console.warn('[structure-check] output_text has no paragraph breaks (\\n\\n)')
    return
  }
  const longestSegment = Math.max(...text.split('\n\n').map((segment) => segment.length))
  if (longestSegment >= 500) {
    console.warn(`[structure-check] output_text has a ${longestSegment}-char run with no break`)
  }
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

  const body = await context.request.json()
  const parsed = generationFormSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const input = parsed.data

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('credits')
    .single()

  if (profileError || !profile || profile.credits < 1) {
    return Response.json({ error: 'insufficient_credits' }, { status: 402 })
  }

  let continuationContext: string | null = null
  let seriesId: string | null = null
  let partNumber: number | null = null

  if (input.continueFromGenerationId) {
    const { data: sourceGeneration } = await supabase
      .from('generations')
      .select('id, series_id, input_text, output_text')
      .eq('id', input.continueFromGenerationId)
      .single()

    if (!sourceGeneration) {
      return Response.json({ error: 'continuation_source_not_found' }, { status: 404 })
    }

    const { data: latestVersion } = await supabase
      .from('generation_versions')
      .select('output_text')
      .eq('generation_id', sourceGeneration.id)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    const previousText = latestVersion?.output_text ?? sourceGeneration.output_text ?? ''
    continuationContext = previousText.length > 4000 ? previousText.slice(-4000) : previousText

    seriesId = sourceGeneration.series_id
    if (!seriesId) {
      const { data: newSeries } = await supabase
        .from('generation_series')
        .insert({
          user_id: user.id,
          title: sourceGeneration.input_text?.slice(0, 60) || '제목 없는 시리즈',
        })
        .select('id')
        .single()
      seriesId = newSeries?.id ?? null
      if (seriesId) {
        await supabase
          .from('generations')
          .update({ series_id: seriesId, part_number: 1 })
          .eq('id', sourceGeneration.id)
      }
    }

    if (seriesId) {
      const { data: maxPartRow } = await supabase
        .from('generations')
        .select('part_number')
        .eq('series_id', seriesId)
        .order('part_number', { ascending: false })
        .limit(1)
        .maybeSingle()
      partNumber = (maxPartRow?.part_number ?? 1) + 1
    }
  }

  const openai = new OpenAI({ apiKey: context.env.OPENAI_API_KEY })

  const encoder = new TextEncoder()
  let fullText = ''
  let tokensUsed = 0

  const readable = new ReadableStream({
    async start(controller) {
      try {
        let authorStyle: { description: string; tier: string; traits: string[] | null } | null =
          null
        if (input.authorStyleId) {
          const { data: authorStyleRow } = await supabase
            .from('author_styles')
            .select('style_description, tier, traits')
            .eq('id', input.authorStyleId)
            .single()
          authorStyle = authorStyleRow
            ? {
                description: authorStyleRow.style_description,
                tier: authorStyleRow.tier,
                traits: authorStyleRow.traits,
              }
            : null
        }

        let imageDescription: string | null = null

        if (input.inputImageUrls.length > 0) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ status: 'analyzing_image' })}\n\n`),
          )

          const visionInstruction =
            input.imageMode === 'ocr'
              ? '이미지에 포함된 텍스트를 빠짐없이 정확하게 그대로 추출하라. 해석하거나 요약하지 마라.'
              : '이미지의 분위기, 색감, 구도, 피사체의 인상을 감각적인 언어로 묘사하라. 텍스트가 있어도 무시하라.'

          const visionResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: visionInstruction },
                  { type: 'image_url', image_url: { url: input.inputImageUrls[0] } },
                ],
              },
            ],
          })

          imageDescription = visionResponse.choices[0]?.message?.content ?? null
          tokensUsed += visionResponse.usage?.total_tokens ?? 0
        }

        const { system, user: userPrompt } = buildPrompt(
          input,
          imageDescription,
          authorStyle,
          continuationContext,
        )

        const stream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          stream: true,
          stream_options: { include_usage: true },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: userPrompt },
          ],
        })

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content
          if (delta) {
            fullText += delta
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`))
          }
          if (chunk.usage) {
            tokensUsed += chunk.usage.total_tokens
          }
        }

        logStructureIntegrity(fullText)

        const seoKeywordsArray = input.seoKeywords
          ? input.seoKeywords
              .split(',')
              .map((keyword) => keyword.trim())
              .filter(Boolean)
          : null

        const { data: recorded, error: recordError } = await supabase.rpc('record_generation', {
          p_input_text: input.inputText,
          p_input_image_urls: input.inputImageUrls,
          p_doc_type: input.docType,
          p_target_audience: input.targetAudience,
          p_output_text: fullText,
          p_tokens_used: tokensUsed,
          p_style: input.style || null,
          p_tone: input.tone || null,
          p_length: input.length || null,
          p_language: input.language || null,
          p_development_structure: input.developmentStructure || null,
          p_author_style_id: input.authorStyleId || null,
          p_style_preset: input.stylePreset || null,
          p_series_id: seriesId,
          p_part_number: partNumber,
          p_image_mode: input.imageMode || null,
          p_additional_instruction: input.additionalInstruction || null,
          p_seo_keywords: seoKeywordsArray,
          p_output_format: input.outputFormat || null,
        })

        if (recordError) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: recordError.message })}\n\n`),
          )
        } else {
          const result = Array.isArray(recorded) ? recorded[0] : recorded
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                generationId: result?.generation_id,
                remainingCredits: result?.remaining_credits,
              })}\n\n`,
            ),
          )
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              error: err instanceof Error ? err.message : 'generation_failed',
            })}\n\n`,
          ),
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
