import type { Profile } from '@/types'

/**
 * レベルnに到達するのに必要な累計XP。
 * 1回のクエスト（約8分・5問）で150〜200XP前後、1日30分〜1時間で700〜1,100XP。
 * → 約5日でLv10（3,600XP）に届くように調整している。
 */
export function totalXpForLevel(level: number): number {
  return 40 * level * (level - 1)
}

export function profileFromXp(totalXp: number): Profile {
  let level = 1
  while (totalXp >= totalXpForLevel(level + 1)) level++
  const base = totalXpForLevel(level)
  return {
    total_xp: totalXp,
    level,
    xp_in_level: totalXp - base,
    xp_for_next: totalXpForLevel(level + 1) - base,
  }
}

export const SURVEY_LEVEL = 10
