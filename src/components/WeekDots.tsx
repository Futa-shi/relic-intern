import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Checkin } from '@/types'
import { lastNDays, parseLocalDate, today } from '@/lib/date'
import { cn } from '@/lib/utils'

interface Props {
  checkins: Checkin[]
  onToggle?: (date: string) => void
}

/** 直近7日の done / missed / 未記録 を表示。onToggle があればタップで切り替え */
export function WeekDots({ checkins, onToggle }: Props) {
  const byDate = new Map(checkins.map((c) => [c.date, c.status]))
  const t = today()
  return (
    <div className="flex justify-between gap-1">
      {lastNDays(7).map((d) => {
        const status = byDate.get(d)
        const label = format(parseLocalDate(d), 'E', { locale: ja })
        const Comp = onToggle ? 'button' : 'div'
        return (
          <Comp
            key={d}
            type={onToggle ? 'button' : undefined}
            onClick={onToggle ? () => onToggle(d) : undefined}
            className="flex flex-1 flex-col items-center gap-1"
            aria-label={`${d} ${status ?? '未記録'}`}
          >
            <span className={cn('text-[10px] text-muted-foreground', d === t && 'font-bold text-primary')}>{label}</span>
            <span
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
                status === 'done' && 'bg-primary text-primary-foreground',
                status === 'missed' && 'bg-secondary text-muted-foreground',
                !status && 'border-2 border-dashed border-border',
                d === t && !status && 'border-primary/50',
              )}
            >
              {status === 'done' ? '✓' : status === 'missed' ? '–' : ''}
            </span>
          </Comp>
        )
      })}
    </div>
  )
}
