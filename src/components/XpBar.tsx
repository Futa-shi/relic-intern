import type { Profile } from '@/types'

export function XpBar({ profile }: { profile: Profile }) {
  const pct = Math.min(100, Math.round((profile.xp_in_level / profile.xp_for_next) * 100))
  return (
    <div className="w-full">
      <div className="mb-1 flex items-baseline justify-between text-xs text-muted-foreground">
        <span className="text-base font-extrabold text-foreground">Lv.{profile.level}</span>
        <span>
          あと <b className="text-foreground">{profile.xp_for_next - profile.xp_in_level}</b> XP で Lv.{profile.level + 1}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-fuchsia-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
