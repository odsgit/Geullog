import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { generationFormSchema } from '../../src/lib/generationSchema'
import { buildPrompt } from '../../src/lib/promptTemplates'

interface Env {
  OPENAI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
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

  const openai = new OpenAI({ apiKey: context.env.OPENAI_API_KEY })

  const encoder = new TextEncoder()
  let fullText = ''
  let tokensUsed = 0

  const readable = new ReadableStream({
    async start(controller) {
      try {
        let imageDescription: string | null = null

        if (input.inputImageUrls.length > 0) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ status: 'analyzing_image' })}\n\n`),
          )

          const visionResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: '이 사진에 무엇이 담겨 있는지 글쓰기에 참고할 수 있도록 자세히 설명해주세요.',
                  },
                  { type: 'image_url', image_url: { url: input.inputImageUrls[0] } },
                ],
              },
            ],
          })

          imageDescription = visionResponse.choices[0]?.message?.content ?? null
          tokensUsed += visionResponse.usage?.total_tokens ?? 0
        }

        const { system, user: userPrompt } = buildPrompt(input, imageDescription)

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

        const { data: recorded, error: recordError } = await supabase.rpc('record_generation', {
          p_input_text: input.inputText,
          p_input_image_urls: input.inputImageUrls,
          p_doc_type: input.docType,
          p_style: input.style,
          p_tone: input.tone,
          p_target_audience: input.targetAudience,
          p_length: input.length,
          p_language: input.language,
          p_output_text: fullText,
          p_tokens_used: tokensUsed,
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
