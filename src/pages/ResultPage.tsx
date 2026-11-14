import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { toPng } from 'html-to-image'
import { Flame, Home, Share2 } from 'lucide-react'
import type { Habit, PracticeSession, Profile } from '@/types'
import { Avatar, stageForLevel } from '@/components/Avatar'
import { XpBar } from '@/components/XpBar'
import { SurveyDialog } from '@/components/SurveyDialog'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { getHabit, getOverallStreak, getProfile, getSession, getSurveyResponse } from '@/lib/repository'
import { SURVEY_LEVEL } from '@/lib/level'
import { cn } from '@/lib/utils'

export function ResultPage() {
  const { sessionId = '' } = useParams()
  const location = useLocation()
  const prevLevel = (location.state as { prevLevel?: number } | null)?.prevLevel
  const [session, setSession] = useState<PracticeSession | null | undefined>(undefined)
  const [habit, setHabit] = useState<Habit | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [streak, setStreak] = useState(0)
  const [levelUpOpen, setLevelUpOpen] = useState(false)
  const [surveyOpen, setSurveyOpen] = useState(false)
  const [sharing, setSharing] = useState(false)
  const shareRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ;(async () => {
      const s = await getSession(sessionId)
      setSession(s)
      if (!s) return
      setHabit(await getHabit(s.habit_id))
      const p = await getProfile()
      setProfile(p)
      setStreak(await getOverallStreak())
      if (prevLevel !== undefined && p.level > prevLevel) setLevelUpOpen(true)
      else if (p.level >= SURVEY_LEVEL && !(await getSurveyResponse())) setSurveyOpen(true)
    })()
  }, [sessionId, prevLevel])

  async function closeLevelUp() {
    setLevelUpOpen(false)
    if (profile && profile.level >= SURVEY_LEVEL && !(await getSurveyResponse())) setSurveyOpen(true)
  }

  async function share() {
    if (!shareRef.current) return
    setSharing(true)
    try {
      const dataUrl = await toPng(shareRef.current, { pixelRatio: 2, cacheBust: true })
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], 'speak-up-ai.png', { type: 'image/png' })
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
      if (nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: `Speak up AI で英語を${session?.words_spoken ?? 0}語話した！ #SpeakUpAI` })
      } else {
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = 'speak-up-ai.png'
        a.click()
        toast({ title: '画像を保存しました' })
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast({ title: '画像を作れませんでした', variant: 'destructive' })
    } finally {
      setSharing(false)
    }
  }

  if (session === undefined || (session && !profile)) return null
  if (session === null || !profile) {
    return (
      <div className="space-y-4 pt-10 text-center">
        <p>記録が見つかりませんでした</p>
        <Link to="/" className={buttonVariants()}>ホームへ</Link>
      </div>
    )
  }

  const stage = stageForLevel(profile.level)
  const minutes = Math.max(1, Math.round(session.speaking_seconds / 60))

  return (
    <div className="space-y-5">
      {/* シェア画像になる部分 */}
      <div ref={shareRef} className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-violet-500 to-fuchsia-500 p-5 text-white">
        <p className="text-center text-sm font-bold opacity-90">{session.answers > 0 ? 'QUEST CLEAR!' : 'おつかれさま'}</p>
        <p className="text-center text-xl font-black">{habit ? `${habit.emoji} ${habit.title}` : 'Speak up AI'}</p>
        <div className="my-2 flex justify-center">
          <div className="rounded-full bg-white/20 p-2">
            <Avatar level={profile.level} mood="happy" size={130} animate={false} />
          </div>
        </div>
        <p className="text-center text-sm font-bold">{stage.name}・Lv.{profile.level}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="獲得XP" value={`+${session.xp}`} />
          <Stat label="話した単語" value={`${session.words_spoken}`} />
          <Stat label="連続" value={`${streak}日`} />
        </div>
        <p className="mt-4 text-center text-[10px] font-bold tracking-widest opacity-80">SPEAK UP AI</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <XpBar profile={profile} />
          <ul className="space-y-1 text-sm">
            <li>🗣️ {session.answers}問に答えた（約{minutes}分）</li>
            <li>🛟 助けを使った質問：{session.helps_used}問 {session.helps_used > 0 && <span className="text-muted-foreground">— 詰まっても最後まで話せたのがえらい！</span>}</li>
            <li className="flex items-center gap-1"><Flame className="h-4 w-4 text-orange-500" /> {streak}日連続で話しています</li>
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-2">
        <Button size="lg" variant="accent" onClick={share} disabled={sharing}>
          <Share2 /> {sharing ? '画像を作成中…' : '画像でシェア'}
        </Button>
        <Link to="/" className={cn(buttonVariants({ size: 'lg' }))}>
          <Home /> ホームへ
        </Link>
      </div>

      <Dialog open={levelUpOpen} onOpenChange={(o) => !o && closeLevelUp()}>
        <DialogContent>
          <DialogHeader>
            <div className="flex justify-center">
              <Avatar level={profile.level} mood="happy" size={140} />
            </div>
            <DialogTitle className="text-2xl">LEVEL UP! Lv.{profile.level}</DialogTitle>
            <DialogDescription>
              {prevLevel !== undefined && stageForLevel(prevLevel).name !== stage.name
                ? `ボイが「${stage.name}」に進化した！${stage.description}`
                : '話すほどボイが育っていくよ。この調子！'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="lg" onClick={closeLevelUp}>やったね！</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SurveyDialog open={surveyOpen} level={profile.level} onDone={() => setSurveyOpen(false)} />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/15 py-2">
      <p className="text-lg font-black">{value}</p>
      <p className="text-[10px] opacity-90">{label}</p>
    </div>
  )
}
