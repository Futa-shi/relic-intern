import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { createHabit } from '@/lib/repository'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

const EMOJIS = ['💬', '✈️', '🍽️', '🏨', '💼', '🛍️', '🏥', '📞', '🎤', '🤝']

export function CreateQuestDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [emoji, setEmoji] = useState(EMOJIS[0])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    await createHabit({ title, goal: goal || `${title}を英語でできるようになる`, emoji })
    toast({ title: 'クエストを追加したよ', description: `${emoji} ${title}` })
    setTitle('')
    setGoal('')
    setEmoji(EMOJIS[0])
    setOpen(false)
    onCreated()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full border-dashed">
          <Plus /> 自分のクエストを作る
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>新しいクエスト</DialogTitle>
            <DialogDescription>英語で話せるようになりたい場面を登録しよう</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap justify-center gap-2">
            {EMOJIS.map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => setEmoji(em)}
                className={cn('h-10 w-10 rounded-lg text-xl', emoji === em ? 'bg-primary/15 ring-2 ring-primary' : 'bg-secondary')}
              >
                {em}
              </button>
            ))}
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold" htmlFor="q-title">場面</label>
            <Input id="q-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：ホテルのチェックイン" maxLength={30} required />
          </div>
          <div className="grid gap-1.5">
            <label className="text-sm font-semibold" htmlFor="q-goal">ゴール</label>
            <Input id="q-goal" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="例：予約名と希望を伝えられる" maxLength={60} />
          </div>
          <DialogFooter>
            <Button type="submit" size="lg" disabled={!title.trim()}>
              追加する
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
