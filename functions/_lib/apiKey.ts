import type { SupabaseClient, User } from '@supabase/supabase-js'
import { isAdminEmail } from '../../src/lib/admin'

type ApiKeyResult = { ok: true; apiKey: string } | { ok: false; response: Response }

// 관리자(odsbig@gmail.com)는 서버 공용 키를 쓰고, 그 외 사용자는 설정 페이지에서
// 직접 입력해 profiles.openai_api_key에 저장한 자신의 키를 써야 생성 기능을 쓸 수 있다.
export async function resolveOpenAiApiKey(
  supabase: SupabaseClient,
  user: Pick<User, 'email'>,
  serverApiKey: string,
): Promise<ApiKeyResult> {
  if (isAdminEmail(user.email)) {
    return { ok: true, apiKey: serverApiKey }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('openai_api_key')
    .single()

  if (!profile?.openai_api_key) {
    return {
      ok: false,
      response: Response.json({ error: 'openai_api_key_required' }, { status: 412 }),
    }
  }

  return { ok: true, apiKey: profile.openai_api_key }
}
