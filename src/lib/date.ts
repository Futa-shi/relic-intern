import { format, parseISO, subDays } from 'date-fns'

/** 端末のローカル日付を 'YYYY-MM-DD' で返す */
export function toLocalDate(d: Date = new Date()): string {
  return format(d, 'yyyy-MM-dd')
}

export function today(): string {
  return toLocalDate()
}

export function daysBack(n: number, from: Date = new Date()): string {
  return toLocalDate(subDays(from, n))
}

/** 今日を含む直近n日を古い順に返す */
export function lastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => daysBack(n - 1 - i))
}

export function parseLocalDate(date: string): Date {
  return parseISO(date)
}

/**
 * 日付集合から連続日数を数える。
 * 今日やっていればそこから、まだなら昨日から遡る（今日やる前に途切れて見えないように）。
 */
export function countStreak(dates: Set<string>): number {
  let offset = dates.has(daysBack(0)) ? 0 : 1
  let streak = 0
  while (dates.has(daysBack(offset))) {
    streak++
    offset++
  }
  return streak
}
