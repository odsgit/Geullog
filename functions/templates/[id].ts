import { createClient } from '@supabase/supabase-js'
import { docTypeOptions, styleOptions, toneOptions } from '../../src/lib/generationSchema'

interface Env {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  ASSETS: Fetcher
}

function truncate(text: string, max: number) {
  const trimmed = text.trim().replace(/\s+/g, ' ')
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function labelOf(options: readonly { value: string; label: string }[], value: string | null) {
  return options.find((option) => option.value === value)?.label
}

// Search engines and crawlers don't execute JS, so the SPA's static index.html
// can't carry per-template SEO metadata. This rewrites <title>/description
// server-side while still serving the same bundle for real visitors.
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const assetResponse = await context.env.ASSETS.fetch(context.request)

  const id = context.params.id
  if (typeof id !== 'string') return assetResponse

  const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_ANON_KEY)
  const { data: template } = await supabase
    .from('templates')
    .select('title, doc_type, style, tone, prompt_text')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  if (!template) return assetResponse

  const tags = [
    labelOf(docTypeOptions, template.doc_type),
    labelOf(styleOptions, template.style),
    labelOf(toneOptions, template.tone),
  ]
    .filter(Boolean)
    .join(', ')

  const title = escapeHtml(`Geullog 템플릿 - ${template.title}`)
  const description = escapeHtml(
    truncate(
      tags
        ? `${tags} 조합의 템플릿. ${template.prompt_text ?? ''}`
        : (template.prompt_text ?? template.title),
      120,
    ),
  )
  const pageUrl = escapeHtml(context.request.url)

  return new HTMLRewriter()
    .on('title', {
      element(element) {
        element.setInnerContent(title)
      },
    })
    .on('head', {
      element(element) {
        element.append(
          `<meta name="description" content="${description}" />` +
            `<meta property="og:title" content="${title}" />` +
            `<meta property="og:description" content="${description}" />` +
            `<meta property="og:type" content="article" />` +
            `<meta property="og:url" content="${pageUrl}" />`,
          { html: true },
        )
      },
    })
    .transform(assetResponse)
}
