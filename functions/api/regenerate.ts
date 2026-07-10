import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { regenerateRequestSchema, type GenerationFormValues } from '../../src/lib/generationSchema'
import { buildPrompt, NO_MARKDOWN_INSTRUCTION } from '../../src/lib/promptTemplates'
import { resolveOpenAiApiKey } from '../_lib/apiKey'

interface Env {
  OPENAI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

const toneAdjustmentInstructions: Record<'more_casual' | 'more_formal', string> = {
  more_casual: '아래 글을 내용은 그대로 유지하면서 더 캐주얼하고 편안한 어조로 다시 써주세요.',
  more_formal: '아래 글을 내용은 그대로 유지하면서 더 격식있고 정중한 어조로 다시 써주세요.',
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
  const parsed = regenerateRequestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }
  const input = parsed.data

  const { data: generation, error: generationError } = await supabase
    .from('generations')
    .select('*')
    .eq('id', input.generationId)
    .single()

  if (generationError || !generation) {
    return Response.json({ error: 'not_found' }, { status: 404 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('credits')
    .single()

  if (profileError || !profile || profile.credits < 1) {
    return Response.json({ error: 'insufficient_credits' }, { status: 402 })
  }

  const openai = new OpenAI({ apiKey: keyResult.apiKey })

  const encoder = new TextEncoder()
  let fullText = ''

  const readable = new ReadableStream({
    async start(controller) {
      try {
        let system: string
        let userPrompt: string

        if (input.mode === 'regenerate') {
          const formValues: GenerationFormValues = {
            inputText: generation.input_text ?? '',
            docType: generation.doc_type,
            style: generation.style ?? undefined,
            tone: generation.tone ?? undefined,
            targetAudience: generation.target_audience ?? '',
            length: generation.length ?? undefined,
            language: generation.language ?? 'ko',
            inputImageUrls: Array.isArray(generation.input_image_urls)
              ? (generation.input_image_urls as string[])
              : [],
            developmentStructure: generation.development_structure ?? undefined,
            stylePreset: generation.style_preset ?? undefined,
            imageMode: generation.image_mode ?? undefined,
            additionalInstruction: generation.additional_instruction ?? undefined,
            seoKeywords: generation.seo_keywords?.length ? generation.seo_keywords.join(', ') : undefined,
            outputFormat: generation.output_format ?? undefined,
          }

          let imageDescription: string | null = null
          if (formValues.inputImageUrls.length > 0) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ status: 'analyzing_image' })}\n\n`),
            )
            const visionInstruction =
              formValues.imageMode === 'ocr'
                ? '이미지에 포함된 텍스트를 빠짐없이 정확하게 그대로 추출하라. 해석하거나 요약하지 마라.'
                : '이미지의 분위기, 색감, 구도, 피사체의 인상을 감각적인 언어로 묘사하라. 텍스트가 있어도 무시하라.'
            const visionResponse = await openai.chat.completions.create({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: visionInstruction },
                    { type: 'image_url', image_url: { url: formValues.inputImageUrls[0] } },
                  ],
                },
              ],
            })
            imageDescription = visionResponse.choices[0]?.message?.content ?? null
          }

          let authorStyle: { description: string; tier: string; traits: string[] | null } | null =
            null
          if (generation.author_style_id) {
            const { data: authorStyleRow } = await supabase
              .from('author_styles')
              .select('style_description, tier, traits')
              .eq('id', generation.author_style_id)
              .single()
            authorStyle = authorStyleRow
              ? {
                  description: authorStyleRow.style_description,
                  tier: authorStyleRow.tier,
                  traits: authorStyleRow.traits,
                }
              : null
          }

          const built = buildPrompt(formValues, imageDescription, authorStyle)
          system = built.system
          userPrompt = built.user
        } else {
          const baseText = input.currentText ?? generation.output_text ?? ''
          system = `당신은 전문 카피라이터이자 콘텐츠 작가입니다. ${NO_MARKDOWN_INSTRUCTION}`
          userPrompt = `${toneAdjustmentInstructions[input.mode]}\n\n${baseText}`
        }

        const stream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          stream: true,
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
        }

        const { data: recorded, error: recordError } = await supabase.rpc(
          'record_generation_version',
          {
            p_generation_id: input.generationId,
            p_output_text: fullText,
            p_action: input.mode,
            p_version_type: input.mode === 'regenerate' ? 'generated' : 'tone_adjusted',
          },
        )

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
                versionId: result?.version_id,
                remainingCredits: result?.remaining_credits,
              })}\n\n`,
            ),
          )
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              error: err instanceof Error ? err.message : 'regeneration_failed',
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
