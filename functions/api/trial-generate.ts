import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { generationFormSchema } from '../../src/lib/generationSchema'
import { buildPrompt } from '../../src/lib/promptTemplates'

interface Env {
  OPENAI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
}

async function hashIp(ip: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip))
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const ip =
    context.request.headers.get('CF-Connecting-IP') ??
    context.request.headers.get('x-forwarded-for') ??
    'unknown'
  const ipHash = await hashIp(ip)

  const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_ANON_KEY)
  const { data: claim, error: claimError } = await supabase.rpc('claim_trial', {
    p_ip_hash: ipHash,
  })

  if (claimError || !claim?.success) {
    return Response.json({ error: 'trial_already_used' }, { status: 429 })
  }

  const body = (await context.request.json()) as Record<string, unknown>
  const parsed = generationFormSchema.safeParse({ ...body, inputImageUrls: [] })
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_request', details: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const openai = new OpenAI({ apiKey: context.env.OPENAI_API_KEY })
  const { system, user: userPrompt } = buildPrompt(parsed.data)

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
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
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`))
          }
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
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
