import type OpenAI from 'openai'

type ChatCompletionParams = OpenAI.Chat.ChatCompletionCreateParamsNonStreaming

// The OpenAI API key must never reach the browser bundle, so this client calls
// our own Cloudflare Pages Function (functions/api/openai.ts), which holds the
// key server-side and proxies the request to OpenAI.
export async function createChatCompletion(params: ChatCompletionParams) {
  const res = await fetch('/api/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    throw new Error(`OpenAI request failed: ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<OpenAI.Chat.ChatCompletion>
}
