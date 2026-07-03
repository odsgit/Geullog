import { createClient } from '@supabase/supabase-js'
import { docTypeOptions } from '../../src/lib/generationSchema'

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

// Crawlers (KakaoTalk, Twitter, etc.) don't execute JS, so the SPA's static
// index.html can't carry per-share OG tags. This rewrites them server-side
// while still serving the same bundle so the client-side app takes over as usual.
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const assetResponse = await context.env.ASSETS.fetch(context.request)

  const id = context.params.id
  if (typeof id !== 'string') return assetResponse

  const supabase = createClient(context.env.SUPABASE_URL, context.env.SUPABASE_ANON_KEY)
  const { data: generation } = await supabase
    .from('generations')
    .select('doc_type, output_text')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  if (!generation?.output_text) return assetResponse

  const docTypeLabel = docTypeOptions.find((option) => option.value === generation.doc_type)?.label
  const title = escapeHtml(docTypeLabel ? `Geullog로 만든 ${docTypeLabel}` : 'Geullog로 만든 글')
  const description = escapeHtml(truncate(generation.output_text, 90))
  const pageUrl = escapeHtml(context.request.url)
  const imageUrl = escapeHtml(new URL('/og-image.png', context.request.url).toString())

  return new HTMLRewriter()
    .on('title', {
      element(element) {
        element.setInnerContent(title)
      },
    })
    .on('head', {
      element(element) {
        element.append(
          `<meta property="og:title" content="${title}" />` +
            `<meta property="og:description" content="${description}" />` +
            `<meta property="og:type" content="article" />` +
            `<meta property="og:url" content="${pageUrl}" />` +
            `<meta property="og:image" content="${imageUrl}" />` +
            `<meta name="twitter:card" content="summary_large_image" />` +
            `<meta name="twitter:title" content="${title}" />` +
            `<meta name="twitter:description" content="${description}" />`,
          { html: true },
        )
      },
    })
    .transform(assetResponse)
}
