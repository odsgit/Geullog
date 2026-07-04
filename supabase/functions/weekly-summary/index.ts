// Weekly usage-summary email, triggered by a pg_cron job (see the
// secure_weekly_summary_cron migration) every Monday. For each user: "이번 주
// 생성한 글 N개, 남은 크레딧 M개". Sends via Resend's REST API.
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase
// into every Edge Function's environment — no manual secret needed for those.
// RESEND_API_KEY must be set manually once a Resend account exists:
//   supabase secrets set RESEND_API_KEY=re_xxx
// Until then, this function still runs and reports what it *would* send.
//
// CRON_SECRET gates the function itself: the JWT check alone isn't enough
// since the cron job's Authorization header uses the public anon key (any
// valid JWT satisfies verify_jwt, and the anon key is bundled into every
// client). Without this, anyone could trigger the function on demand and
// read every user's email from the response.
import { createClient } from 'npm:@supabase/supabase-js@2'

interface UserSummary {
  email: string
  weeklyCount: number
  credits: number
}

async function sendSummaryEmail(apiKey: string, summary: UserSummary): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Geullog <onboarding@resend.dev>',
      to: summary.email,
      subject: '이번 주 Geullog 사용 요약',
      html: `
        <p>안녕하세요, Geullog입니다.</p>
        <p>이번 주 생성한 글 <strong>${summary.weeklyCount}개</strong>, 남은 크레딧 <strong>${summary.credits}개</strong>입니다.</p>
        <p>이번 주에도 Geullog와 함께 글쓰기를 이어가보세요!</p>
      `,
    }),
  })
  return res.ok
}

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get('CRON_SECRET')
  if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
    return Response.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )
  const resendApiKey = Deno.env.get('RESEND_API_KEY')

  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers()
  if (usersError) {
    return Response.json({ error: usersError.message }, { status: 500 })
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const results: { email: string; sent: boolean; reason?: string }[] = []

  for (const user of usersData.users) {
    if (!user.email) continue

    const [{ data: profile }, { count }] = await Promise.all([
      supabase.from('profiles').select('credits').eq('id', user.id).single(),
      supabase
        .from('generations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', oneWeekAgo),
    ])

    if (!profile) continue

    const summary: UserSummary = {
      email: user.email,
      weeklyCount: count ?? 0,
      credits: profile.credits,
    }

    if (!resendApiKey) {
      results.push({ email: user.email, sent: false, reason: 'RESEND_API_KEY not configured' })
      continue
    }

    const sent = await sendSummaryEmail(resendApiKey, summary)
    results.push({ email: user.email, sent })
  }

  return Response.json({ processed: results.length, results })
})
