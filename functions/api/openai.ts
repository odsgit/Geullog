import OpenAI from 'openai'

interface Env {
  OPENAI_API_KEY: string
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const openai = new OpenAI({ apiKey: context.env.OPENAI_API_KEY })
  const body = await context.request.json()

  const completion = await openai.chat.completions.create(body)

  return Response.json(completion)
}
