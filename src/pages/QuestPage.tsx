import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Flame, Mic, Trash2 } from 'lucide-react'
import type { Checkin, Habit } from '@/types'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { WeekDots } from '@/components/WeekDots'
import { toast } from '@/components/ui/use-toast'
import { deleteHabit, getHabit, getStreak, listCheckins, upsertCheckin } from '@/lib/repository'
import { contentFor } from '@/lib/questContent'
import { cn } from '@/lib/utils'

export function QuestPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [habit, setHabit] = useState<Habit | null | undefined>(undefined)
  const [checkins, setCheckins] = useState<Checkin[]>([])
  const [streak, setStreak] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const load = useCallback(async () => {
    setHabit(await getHabit(id))
    setCheckins(await listCheckins(id))
    setStreak(await getStreak(id))
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (habit === undefined) return null
  if (habit === null) {
    return (
      <div className="space-y-4 pt-10 text-center">
        <p>クエストが見つかりませんでした</p>
        <Link to="/" className={buttonVariants()}>ホームへ</Link>
      </div>
    )
  }

  const { questions } = contentFor(habit.title, habit.goal)

  async function toggle(date: string) {
    const cur = checkins.find((c) => c.date === date)?.status
    await upsertCheckin({ habit_id: id, date, status: cur === 'done' ? 'missed' : 'done' })
    load()
  }

  async function remove() {
    await deleteHabit(id)
    toast({ title: 'クエストを削除しました' })
    navigate('/')
  }

  return (
    <div className="space-y-5">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> ホーム
      </Link>

      <div className="text-center">
        <div className="text-6xl">{habit.emoji}</div>
        <h1 className="mt-2 text-2xl font-black">{habit.title}</h1>
        <p className="text-sm text-muted-foreground">🎯 {habit.goal}</p>
      </div>

      <Link to={`/talk/${habit.id}`} className={cn(buttonVariants({ size: 'lg' }), 'h-14 w-full text-lg')}>
        <Mic className="!size-5" /> このクエストで話す
      </Link>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">直近7日</CardTitle>
            <span className="flex items-center gap-1 text-sm font-bold text-orange-500">
              <Flame className="h-4 w-4" /> {streak}日連続
            </span>
          </div>
          <CardDescription>丸をタップすると記録を付け直せます</CardDescription>
        </CardHeader>
        <CardContent>
          <WeekDots checkins={checkins} onToggle={toggle} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">こんなことを聞かれるよ</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm">
            {questions.map((q) => (
              <li key={q.en}>
                <span>{q.en}</span>
                <span className="block text-xs text-muted-foreground">{q.ja}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Button variant="ghost" className="w-full text-destructive" onClick={() => setConfirmDelete(true)}>
        <Trash2 /> このクエストを削除
      </Button>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>削除しますか？</DialogTitle>
            <DialogDescription>「{habit.title}」と記録が消えます。獲得したXPは残ります。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={remove}>削除する</Button>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>やめる</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
