/**
 * データの保存・読み込みはすべてこのファイルを通す。
 * 画面からlocalStorageを直接触らないこと。
 *
 * いまはlocalStorage実装。Supabaseに移すときは、このファイルの
 * 各関数の中身を supabase.from('habits')... に差し替えるだけで画面側は変更不要。
 */
import type {
  Checkin,
  CheckinStatus,
  Habit,
  PracticeSession,
  Profile,
  SurveyResponse,
  WillingnessToPay,
} from '@/types'
import { countStreak, today } from '@/lib/date'
import { profileFromXp } from '@/lib/level'
import { QUEST_TEMPLATES } from '@/lib/questContent'

const KEYS = {
  habits: 'speakup:habits',
  checkins: 'speakup:checkins',
  sessions: 'speakup:sessions',
  survey: 'speakup:survey',
  seeded: 'speakup:seeded',
} as const

// ログイン機能ができるまでは null（ローカルの1ユーザー）
const CURRENT_USER_ID: string | null = null

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  // 古いブラウザ向けのフォールバック
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value))
}

/** 初回起動時におすすめクエストを入れておく */
function ensureSeeded(): void {
  if (localStorage.getItem(KEYS.seeded)) return
  const now = Date.now()
  const habits: Habit[] = QUEST_TEMPLATES.map((t, i) => ({
    id: uuid(),
    user_id: CURRENT_USER_ID,
    title: t.title,
    goal: t.goal,
    emoji: t.emoji,
    // 並び順を保つため1msずつずらす
    created_at: new Date(now + i).toISOString(),
  }))
  write(KEYS.habits, habits)
  localStorage.setItem(KEYS.seeded, '1')
}

// ---------- Habit（会話クエスト） ----------

export async function listHabits(): Promise<Habit[]> {
  ensureSeeded()
  return read<Habit[]>(KEYS.habits, []).sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export async function getHabit(id: string): Promise<Habit | null> {
  const habits = await listHabits()
  return habits.find((h) => h.id === id) ?? null
}

export async function createHabit(input: Pick<Habit, 'title' | 'goal' | 'emoji'>): Promise<Habit> {
  ensureSeeded()
  const habit: Habit = {
    id: uuid(),
    user_id: CURRENT_USER_ID,
    title: input.title.trim(),
    goal: input.goal.trim(),
    emoji: input.emoji || '💬',
    created_at: new Date().toISOString(),
  }
  write(KEYS.habits, [...read<Habit[]>(KEYS.habits, []), habit])
  return habit
}

export async function deleteHabit(id: string): Promise<void> {
  write(
    KEYS.habits,
    read<Habit[]>(KEYS.habits, []).filter((h) => h.id !== id),
  )
  // 関連するチェックインも消す（SupabaseではON DELETE CASCADE想定）
  write(
    KEYS.checkins,
    read<Checkin[]>(KEYS.checkins, []).filter((c) => c.habit_id !== id),
  )
}

// ---------- Checkin（その日にやったか） ----------

export async function listCheckins(habitId: string): Promise<Checkin[]> {
  return read<Checkin[]>(KEYS.checkins, [])
    .filter((c) => c.habit_id === habitId)
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** habit_id + date で1件だけ。既にあれば status を上書きする */
export async function upsertCheckin(input: {
  habit_id: string
  date: string
  status: CheckinStatus
}): Promise<Checkin> {
  const all = read<Checkin[]>(KEYS.checkins, [])
  const idx = all.findIndex((c) => c.habit_id === input.habit_id && c.date === input.date)
  let saved: Checkin
  if (idx >= 0) {
    saved = { ...all[idx], status: input.status }
    all[idx] = saved
  } else {
    saved = {
      id: uuid(),
      habit_id: input.habit_id,
      date: input.date,
      status: input.status,
      created_at: new Date().toISOString(),
    }
    all.push(saved)
  }
  write(KEYS.checkins, all)
  return saved
}

/** done が何日続いているか（今日まだなら昨日から数える） */
export async function getStreak(habitId: string): Promise<number> {
  const checkins = await listCheckins(habitId)
  return countStreak(new Set(checkins.filter((c) => c.status === 'done').map((c) => c.date)))
}

// ---------- 練習ログ・経験値 ----------

export async function listSessions(): Promise<PracticeSession[]> {
  return read<PracticeSession[]>(KEYS.sessions, []).sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  )
}

export async function getSession(id: string): Promise<PracticeSession | null> {
  return read<PracticeSession[]>(KEYS.sessions, []).find((s) => s.id === id) ?? null
}

export async function addSession(
  input: Omit<PracticeSession, 'id' | 'user_id' | 'date' | 'created_at'>,
): Promise<PracticeSession> {
  const session: PracticeSession = {
    ...input,
    id: uuid(),
    user_id: CURRENT_USER_ID,
    date: today(),
    created_at: new Date().toISOString(),
  }
  write(KEYS.sessions, [...read<PracticeSession[]>(KEYS.sessions, []), session])
  return session
}

export async function getProfile(): Promise<Profile> {
  const sessions = await listSessions()
  return profileFromXp(sessions.reduce((sum, s) => sum + s.xp, 0))
}

/** どのクエストでもいいので話した日が何日続いているか */
export async function getOverallStreak(): Promise<number> {
  const sessions = await listSessions()
  return countStreak(new Set(sessions.map((s) => s.date)))
}

// ---------- アンケート ----------

export async function getSurveyResponse(): Promise<SurveyResponse | null> {
  return read<SurveyResponse | null>(KEYS.survey, null)
}

export async function saveSurveyResponse(input: {
  level: number
  willing_to_pay: WillingnessToPay
  comment: string
}): Promise<SurveyResponse> {
  const res: SurveyResponse = {
    ...input,
    id: uuid(),
    user_id: CURRENT_USER_ID,
    created_at: new Date().toISOString(),
  }
  write(KEYS.survey, res)
  return res
}
