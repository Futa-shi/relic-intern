import { cn } from '@/lib/utils'

export type AvatarMood = 'idle' | 'talking' | 'listening' | 'thinking' | 'happy'

export interface AvatarStage {
  minLevel: number
  name: string
  description: string
}

/** レベルで見た目が変わる。名前は「ボイ」（Voice の子） */
export const AVATAR_STAGES: AvatarStage[] = [
  { minLevel: 1, name: 'ボイのたまご', description: 'まだ殻の中。話しかけると動く…？' },
  { minLevel: 3, name: 'ちびボイ', description: '殻からでてきた！ひとことずつ話せる' },
  { minLevel: 5, name: 'ヘッドホンボイ', description: '英語がちょっと聞き取れるようになった' },
  { minLevel: 7, name: 'おしゃべりボイ', description: 'マフラーを巻いて、話すのが楽しくなってきた' },
  { minLevel: 10, name: 'グローバルボイ', description: '世界の誰とでも話せる自信がついた！' },
]

export function stageForLevel(level: number): AvatarStage {
  return [...AVATAR_STAGES].reverse().find((s) => level >= s.minLevel) ?? AVATAR_STAGES[0]
}

export function nextStage(level: number): AvatarStage | null {
  return AVATAR_STAGES.find((s) => s.minLevel > level) ?? null
}

const BODY_COLORS = ['#f3e8d2', '#a7f3d0', '#93c5fd', '#c4b5fd', '#fcd34d']

interface Props {
  level: number
  mood?: AvatarMood
  size?: number
  className?: string
  animate?: boolean
}

export function Avatar({ level, mood = 'idle', size = 160, className, animate = true }: Props) {
  const stageIdx = AVATAR_STAGES.indexOf(stageForLevel(level))
  const body = BODY_COLORS[stageIdx]
  const isEgg = stageIdx === 0

  return (
    <div className={cn('relative inline-block', animate && 'animate-bob', className)} style={{ width: size, height: size }}>
      {mood === 'listening' && (
        <span className="absolute inset-4 rounded-full bg-primary/30 animate-pulse-ring" aria-hidden />
      )}
      <svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label={stageForLevel(level).name}>
        {/* 足元の影 */}
        <ellipse cx="100" cy="186" rx="52" ry="8" fill="#000" opacity="0.08" />

        {/* Lv10 オーラ */}
        {stageIdx >= 4 && <circle cx="100" cy="108" r="88" fill="#fde68a" opacity="0.35" />}

        {isEgg ? (
          <g>
            <path d="M100 28 C 145 28, 160 110, 160 130 C 160 165, 135 182, 100 182 C 65 182, 40 165, 40 130 C 40 110, 55 28, 100 28 Z" fill={body} stroke="#d6c4a1" strokeWidth="3" />
            {/* ひび（レベル2で増える） */}
            <path d="M62 104 L76 96 L86 108 L98 98" fill="none" stroke="#b49a6b" strokeWidth="3" strokeLinecap="round" />
            {level >= 2 && <path d="M112 92 L124 104 L136 96" fill="none" stroke="#b49a6b" strokeWidth="3" strokeLinecap="round" />}
            <circle cx="82" cy="132" r="6" fill="#333" />
            <circle cx="118" cy="132" r="6" fill="#333" />
            <Mouth mood={mood} y={152} small />
          </g>
        ) : (
          <g>
            {/* 腕 */}
            <ellipse cx="44" cy="128" rx="12" ry="20" fill={body} transform={mood === 'happy' ? 'rotate(-40 44 128)' : 'rotate(20 44 128)'} />
            <ellipse cx="156" cy="128" rx="12" ry="20" fill={body} transform={mood === 'happy' ? 'rotate(40 156 128)' : 'rotate(-20 156 128)'} />
            {/* 体 */}
            <path d="M100 40 C 150 40, 162 90, 162 128 C 162 166, 134 182, 100 182 C 66 182, 38 166, 38 128 C 38 90, 50 40, 100 40 Z" fill={body} />
            {/* お腹 */}
            <ellipse cx="100" cy="148" rx="36" ry="26" fill="#fff" opacity="0.55" />
            {/* 目 */}
            <Eyes mood={mood} />
            {/* ほっぺ */}
            <circle cx="66" cy="120" r="8" fill="#fb7185" opacity="0.35" />
            <circle cx="134" cy="120" r="8" fill="#fb7185" opacity="0.35" />
            <Mouth mood={mood} y={124} />

            {/* Lv5〜 ヘッドホン */}
            {stageIdx >= 2 && (
              <g>
                <path d="M46 96 C 46 40, 154 40, 154 96" fill="none" stroke="#1f2937" strokeWidth="7" strokeLinecap="round" />
                <rect x="36" y="88" width="18" height="30" rx="8" fill="#ef4444" />
                <rect x="146" y="88" width="18" height="30" rx="8" fill="#ef4444" />
              </g>
            )}
            {/* Lv7〜 マフラー */}
            {stageIdx >= 3 && (
              <g>
                <path d="M54 146 Q 100 166 146 146 L 146 158 Q 100 178 54 158 Z" fill="#f97316" />
                <rect x="120" y="154" width="14" height="26" rx="4" fill="#ea580c" />
              </g>
            )}
            {/* Lv10 王冠 */}
            {stageIdx >= 4 && (
              <path d="M74 44 L 82 18 L 92 36 L 100 12 L 108 36 L 118 18 L 126 44 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
            )}
          </g>
        )}

        {/* 考え中の吹き出し */}
        {mood === 'thinking' && (
          <g>
            <circle cx="168" cy="44" r="16" fill="#fff" stroke="#cbd5e1" strokeWidth="2" />
            <text x="168" y="50" textAnchor="middle" fontSize="18" fill="#6d4aed" fontWeight="bold">?</text>
            <circle cx="150" cy="68" r="5" fill="#fff" stroke="#cbd5e1" strokeWidth="2" />
          </g>
        )}
      </svg>
    </div>
  )
}

function Eyes({ mood }: { mood: AvatarMood }) {
  if (mood === 'happy') {
    return (
      <g fill="none" stroke="#1f2937" strokeWidth="5" strokeLinecap="round">
        <path d="M70 100 Q 80 88 90 100" />
        <path d="M110 100 Q 120 88 130 100" />
      </g>
    )
  }
  const dy = mood === 'thinking' ? -4 : 0
  return (
    <g>
      <ellipse cx="80" cy={100 + dy} rx="9" ry="11" fill="#1f2937" />
      <ellipse cx="120" cy={100 + dy} rx="9" ry="11" fill="#1f2937" />
      <circle cx="83" cy={96 + dy} r="3" fill="#fff" />
      <circle cx="123" cy={96 + dy} r="3" fill="#fff" />
    </g>
  )
}

function Mouth({ mood, y, small }: { mood: AvatarMood; y: number; small?: boolean }) {
  const w = small ? 8 : 12
  if (mood === 'talking') {
    return (
      <ellipse cx="100" cy={y + 4} rx={w * 0.7} ry={w * 0.6} fill="#7f1d1d">
        <animate attributeName="ry" values={`${w * 0.2};${w * 0.7};${w * 0.2}`} dur="0.35s" repeatCount="indefinite" />
      </ellipse>
    )
  }
  if (mood === 'happy') {
    return <path d={`M${100 - w} ${y} Q 100 ${y + w * 1.6} ${100 + w} ${y} Z`} fill="#7f1d1d" />
  }
  if (mood === 'thinking') {
    return <path d={`M${100 - w * 0.6} ${y + 4} L ${100 + w * 0.6} ${y + 2}`} stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
  }
  return <path d={`M${100 - w} ${y} Q 100 ${y + w} ${100 + w} ${y}`} fill="none" stroke="#1f2937" strokeWidth="4" strokeLinecap="round" />
}
