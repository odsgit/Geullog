import { blogPosts } from '../../src/content/blog/posts'

interface Env {
  ASSETS: Fetcher
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Search engines and social crawlers don't execute JS, so the SPA's static
// index.html can't carry per-post SEO metadata. Post metadata is static
// (bundled at build time in posts.ts), so this rewrites <title>/description/OG
// tags server-side while the same client bundle still renders the MDX body.
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const assetResponse = await context.env.ASSETS.fetch(context.request)

  const slug = context.params.slug
  const post = typeof slug === 'string' ? blogPosts.find((entry) => entry.slug === slug) : undefined

  if (!post) return assetResponse

  const title = escapeHtml(`${post.title} - Geullog 블로그`)
  const description = escapeHtml(post.description)
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
