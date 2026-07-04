import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export function AppHeader() {
  const { user } = useAuth()
  const [credits, setCredits] = useState<number | null>(null)
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [inviteCopied, setInviteCopied] = useState(false)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('credits, referral_code')
      .single()
      .then(({ data }) => {
        if (!data) return
        setCredits(data.credits)
        setReferralCode(data.referral_code)
      })
  }, [])

  async function handleInvite() {
    if (!referralCode) return
    await navigator.clipboard.writeText(`${window.location.origin}/?ref=${referralCode}`)
    setInviteCopied(true)
    setTimeout(() => setInviteCopied(false), 2000)
  }

  return (
    <header className="flex items-center justify-between border-b-[3px] border-black bg-white px-6 py-4">
      <div className="flex items-center gap-5">
        <Link to="/" className="text-lg font-black text-black">
          Geullog
        </Link>
        <Link to="/" className="text-sm font-bold text-black/60 hover:text-black">
          글쓰기
        </Link>
        <Link to="/history" className="text-sm font-bold text-black/60 hover:text-black">
          히스토리
        </Link>
        <Link to="/templates" className="text-sm font-bold text-black/60 hover:text-black">
          템플릿
        </Link>
        <Link to="/blog" className="text-sm font-bold text-black/60 hover:text-black">
          블로그
        </Link>
      </div>
      <div className="flex items-center gap-3 text-sm">
        {credits !== null && <span className="brutal-badge-brand">크레딧 {credits}개</span>}
        <button type="button" onClick={handleInvite} className="brutal-btn-sm">
          {inviteCopied ? '링크가 복사되었습니다!' : '친구 초대하기'}
        </button>
        <span className="font-bold text-black/60">{user?.email}</span>
        <button type="button" onClick={() => supabase.auth.signOut()} className="brutal-btn-sm">
          로그아웃
        </button>
      </div>
    </header>
  )
}
