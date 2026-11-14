/**
 * 会話AIのMVP版（ローカルで動くルールベース）。
 * 本番ではサーバーの会話AIに置き換える：回答を送ってフィードバックを受け取る。
 */
import type { Question } from '@/lib/questContent'

export type HelpLevel = 0 | 1 | 2 | 3

/** 黙っている秒数 → 何段階目の助けを出すか */
export const HELP_THRESHOLDS: Record<Exclude<HelpLevel, 0>, number> = {
  1: 5, // 日本語訳と使える単語
  2: 10, // 文の型
  3: 15, // そのまま言える例文
}

/** 話し始めたあと、これだけ黙ったら「言い終わった」とみなす */
export const AUTO_SUBMIT_SILENCE = 3

export const QUEST_CLEAR_BONUS = 30

export function countWords(text: string): number {
  return (text.match(/[A-Za-z][A-Za-z']*/g) ?? []).length
}

export interface AnswerFeedback {
  words: number
  xp: number
  praise: string
  tips: string[]
}

export function reviewAnswer(transcript: string, question: Question, helpLevel: HelpLevel): AnswerFeedback {
  const text = transcript.trim()
  const words = countWords(text)
  const lower = text.toLowerCase()

  // XP：答えたこと自体に10、話した単語1つにつき1（最大30）、自力ボーナス5
  // 助けを使っても減点はしない（詰まっても続けることを一番に褒める）
  const xp = 10 + Math.min(words, 30) + (helpLevel === 0 ? 5 : 0)

  let praise: string
  if (words >= 12) praise = 'すごい！しっかり話せた 🔥'
  else if (words >= 6) praise = 'いいね！ちゃんと伝わったよ 👍'
  else if (words >= 1) praise = '言えた！それが第一歩 ✨'
  else praise = '次はひとことだけでも声に出してみよう'

  const tips: string[] = []
  if (/[぀-ヿ一-龯]/.test(text)) {
    tips.push('日本語が混ざったよ。出てこない単語は「助けて」で単語ヒントを見てみよう')
  }
  if (words > 0 && words < 4) {
    tips.push('もう一言足してみよう。「because 〜」で理由をつけると会話が続くよ')
  } else if (words >= 4 && !/\bbecause\b|\bso\b/.test(lower) && question.pattern.includes('because')) {
    tips.push('理由（because 〜）をつけると、相手が質問を返しやすくなるよ')
  }
  const usedKeyword = question.keywords.some((k) => lower.includes(k.toLowerCase()))
  if (words >= 4 && usedKeyword) tips.push(`「${question.keywords.find((k) => lower.includes(k.toLowerCase()))}」を使えたね！`)
  if (helpLevel >= 3) tips.push('例文を読んだだけでもOK。次は自分の情報に1か所だけ変えて言ってみよう')

  return { words, xp, praise, tips }
}
