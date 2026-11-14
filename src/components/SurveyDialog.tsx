import { useState } from 'react'
import type { WillingnessToPay } from '@/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { saveSurveyResponse } from '@/lib/repository'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

const OPTIONS: { value: WillingnessToPay; label: string }[] = [
  { value: 'yes', label: '払う' },
  { value: 'maybe', label: '迷う' },
  { value: 'no', label: '払わない' },
]

interface Props {
  open: boolean
  level: number
  onDone: () => void
}

/** Lv10到達時に一度だけ聞く「月約1,500円なら払うか」 */
export function SurveyDialog({ open, level, onDone }: Props) {
  const [choice, setChoice] = useState<WillingnessToPay | null>(null)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit() {
    if (!choice) return
    setSaving(true)
    await saveSurveyResponse({ level, willing_to_pay: choice, comment: comment.trim() })
    setSaving(false)
    toast({ title: '回答ありがとう！', description: 'これからもボイと一緒に話そう', variant: 'success' })
    onDone()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDone()}>
      <DialogContent>
        <DialogHeader>
          <div className="text-4xl">🎉</div>
          <DialogTitle>Lv.{level} 到達おめでとう！</DialogTitle>
          <DialogDescription>
            ここまで続けてくれたあなたに、ひとつだけ質問させてください。
          </DialogDescription>
        </DialogHeader>
        <p className="text-center font-bold">Speak up AI が月約1,500円だったら、払って使い続けたいですか？</p>
        <div className="grid grid-cols-3 gap-2">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setChoice(o.value)}
              className={cn(
                'rounded-lg border-2 py-3 font-bold transition-colors',
                choice === o.value ? 'border-primary bg-primary/10 text-primary' : 'border-border',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="理由があれば教えてください（任意）"
          rows={3}
          className="w-full rounded-md border border-input bg-background p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <DialogFooter>
          <Button size="lg" disabled={!choice || saving} onClick={submit}>
            回答する
          </Button>
          <Button variant="ghost" onClick={onDone}>
            あとで
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
