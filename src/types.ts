/**
 * データ型。後でSupabaseのテーブルに1対1で移せるよう、
 * カラム名はsnake_case、日時はISO文字列で持つ。
 *
 * Speak up AI での意味づけ：
 * - Habit   … 会話クエスト（「カフェで注文する」「自己紹介」などの練習テーマ）
 * - Checkin … そのクエストを“その日に”やったかどうかの記録（1日1件）
 */

export interface Habit {
  id: string // uuid
  user_id: string | null
  title: string
  goal: string
  emoji: string
  created_at: string // ISO
}

export type CheckinStatus = 'done' | 'missed'

export interface Checkin {
  id: string // uuid
  habit_id: string
  date: string // 'YYYY-MM-DD'（端末のローカル日付）
  status: CheckinStatus
  created_at: string // ISO
}

/** 1回の会話練習の記録（経験値の元になる行動ログ） */
export interface PracticeSession {
  id: string // uuid
  user_id: string | null
  habit_id: string
  date: string // 'YYYY-MM-DD'
  answers: number // 答えた質問の数
  words_spoken: number // 話した英単語の合計
  helps_used: number // AIの助けを使った回数
  speaking_seconds: number // 会話にかかった秒数
  xp: number
  created_at: string // ISO
}

/** Lv10到達時の「払うか」アンケート回答 */
export type WillingnessToPay = 'yes' | 'maybe' | 'no'

export interface SurveyResponse {
  id: string // uuid
  user_id: string | null
  level: number
  willing_to_pay: WillingnessToPay
  comment: string
  created_at: string // ISO
}

export interface Profile {
  total_xp: number
  level: number
  xp_in_level: number // 今のレベル内で貯まったXP
  xp_for_next: number // 次のレベルまでに必要なXP（レベル内の合計）
}
