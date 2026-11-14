import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Flame, Mic } from 'lucide-react'
import type { Checkin, Habit, Profile } from '@/types'
import { Avatar, nextStage, stageForLevel } from '@/components/Avatar'
import { XpBar } from '@/components/XpBar'
import { WeekDots } from '@/components/WeekDots'
import { CreateQuestDialog } from '@/components/CreateQuestDialog'
import { SurveyDialog } from '@/components/SurveyDialog'
import { Card, CardContent } from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import {
  getOverallStreak,
  getProfile,
  getStreak,
  getSurveyResponse,
  listCheckins,
  listHabits,
  listSessions,
  upsertCheckin,
} from '@/lib/repository'
import { daysBack, today } from '@/lib/date'
import { SURVEY_LEVEL } from '@/lib/level'
import { cn } from '@/lib/utils'

interface QuestRow {
  habit: Habit
  checkins: Checkin[]
  streak: number
}

// 「あとで」を押したら、このタブを開いている間は再表示しない
let surveySnoozed = false

/** 作成日以降で記録のない過去の日（最大7日）を missed として埋める */
async function fillMissed(habit: Habit, checkins: Checkin[]) {
  const created = habit.created_at.slice(0, 10)
  const has = new Set(checkins.map((c) => c.date))
  for (let i = 1; i <= 7; i++) {
    const d = daysBack(i)
    if (d < created) break
    if (!has.has(d)) await upsertCheckin({ habit_id: habit.id, date: d, status: 'missed' })
  }
}

export function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [rows, setRows] = useState<QuestRow[]>([])
  const [streak, setStreak] = useState(0)
  const [todayXp, setTodayXp] = useState(0)
  const [showSurvey, setShowSurvey] = useState(false)

  const load = useCallback(async () => {
    const habits = await listHabits()
    const next: QuestRow[] = []
    for (const habit of habits) {
      await fillMissed(habit, await listCheckins(habit.id))
      next.push({ habit, checkins: await listCheckins(habit.id), streak: await getStreak(habit.id) })
    }
    const p = await getProfile()
    const sessions = await listSessions()
    setRows(next)
    setProfile(p)
    setStreak(await getOverallStreak())
    setTodayXp(sessions.filter((s) => s.date === today()).reduce((n, s) => n + s.xp, 0))
    if (p.level >= SURVEY_LEVEL && !surveySnoozed && !(await getSurveyResponse())) setShowSurvey(true)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (!profile) return null
  const stage = stageForLevel(profile.level)
  const next = nextStage(profile.level)
  const t = today()
  const firstUndone = rows.find((r) => !r.checkins.some((c) => c.date === t && c.status === 'done')) ?? rows[0]

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight">
          Speak up <span className="text-primary">AI</span>
        </h1>
        <div className="flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-600">
          <Flame className="h-4 w-4" /> {streak}日連続
        </div>
      </header>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-b from-primary/15 to-transparent px-5 pt-5 text-center">
          <Avatar level={profile.level} mood={todayXp > 0 ? 'happy' : 'idle'} size={150} />
          <p className="mt-1 text-lg font-extrabold">{stage.name}</p>
          <p className="text-xs text-muted-foreground">{stage.description}</p>
        </div>
        <CardContent className="space-y-3 pt-4">
          <XpBar profile={profile} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>今日 +{todayXp} XP</span>
            {next && <span>Lv.{next.minLevel}で「{next.name}」に進化</span>}
          </div>
        </CardContent>
      </Card>

      {firstUndone && (
        <Link to={`/talk/${firstUndone.habit.id}`} className={cn(buttonVariants({ size: 'lg' }), 'h-14 w-full text-lg shadow-lg shadow-primary/30')}>
          <Mic className="!size-5" /> 今日の会話をはじめる
        </Link>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-bold text-muted-foreground">クエスト</h2>
        {rows.map(({ habit, checkins, streak }) => {
          const doneToday = checkins.some((c) => c.date === t && c.status === 'done')
          return (
            <Link key={habit.id} to={`/quest/${habit.id}`} className="block">
              <Card className={cn('transition-colors hover:border-primary/40', doneToday && 'border-primary/40 bg-primary/5')}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{habit.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">
                        {habit.title}
                        {doneToday && <span className="ml-2 text-xs font-bold text-primary">クリア済み</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{habit.goal}</p>
                    </div>
                    {streak > 0 && (
                      <span className="flex items-center gap-0.5 text-xs font-bold text-orange-500">
                        <Flame className="h-3.5 w-3.5" />
                        {streak}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <WeekDots checkins={checkins} />
                </CardContent>
              </Card>
            </Link>
          )
        })}
        <CreateQuestDialog onCreated={load} />
      </section>

      <SurveyDialog
        open={showSurvey}
        level={profile.level}
        onDone={() => {
          surveySnoozed = true
          setShowSurvey(false)
        }}
      />
    </div>
  )
}
