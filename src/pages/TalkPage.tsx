import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Keyboard, LifeBuoy, Mic, SkipForward, Volume2, X } from 'lucide-react'
import type { Habit } from '@/types'
import { Avatar, type AvatarMood } from '@/components/Avatar'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import { useSilenceTimer } from '@/hooks/useSilenceTimer'
import { addSession, getHabit, getProfile, upsertCheckin } from '@/lib/repository'
import { contentFor } from '@/lib/questContent'
import {
  AUTO_SUBMIT_SILENCE,
  HELP_THRESHOLDS,
  QUEST_CLEAR_BONUS,
  reviewAnswer,
  type AnswerFeedback,
  type HelpLevel,
} from '@/lib/coach'
import { today } from '@/lib/date'
import { cn } from '@/lib/utils'

type Phase = 'intro' | 'ai' | 'listen' | 'feedback' | 'saving'

interface AnswerLog {
  transcript: string
  helpLevel: HelpLevel
  feedback: AnswerFeedback | null // null = スキップ
}

export function TalkPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [habit, setHabit] = useState<Habit | null | undefined>(undefined)
  const [level, setLevel] = useState(1)
  const [phase, setPhase] = useState<Phase>('intro')
  const [qIndex, setQIndex] = useState(0)
  const [helpLevel, setHelpLevel] = useState<HelpLevel>(0)
  const [answers, setAnswers] = useState<AnswerLog[]>([])
  const [typing, setTyping] = useState(false)
  const [typed, setTyped] = useState('')
  const startedAt = useRef(0)
  const answersRef = useRef<AnswerLog[]>([])

  function pushAnswer(log: AnswerLog) {
    answersRef.current = [...answersRef.current, log]
    setAnswers(answersRef.current)
  }

  useEffect(() => {
    getHabit(id).then(setHabit)
    getProfile().then((p) => setLevel(p.level))
  }, [id])

  const content = useMemo(() => (habit ? contentFor(habit.title, habit.goal) : null), [habit])
  const question = content?.questions[qIndex]
  const total = content?.questions.length ?? 0

  const tts = useSpeechSynthesis()
  const silence = useSilenceTimer(phase === 'listen')
  const stt = useSpeechRecognition({
    onActivity: silence.bump,
    onError: (err) => {
      if (err === 'audio-capture') {
        // 無音検知とマイクを取り合う端末では、音声認識を優先する
        silence.releaseMic()
      } else if (err === 'not-allowed' || err === 'service-not-allowed') {
        setTyping(true)
        toast({ title: 'マイクが使えません', description: 'キーボード入力に切り替えました' })
      } else if (err === 'network') {
        setTyping(true)
        toast({ title: '音声認識に接続できません', description: 'キーボード入力に切り替えました' })
      }
    },
  })

  const answerText = typing ? typed.trim() : stt.transcript

  // ---- 質問を読み上げて、聞き取りを始める ----
  const askQuestion = useCallback(
    async (index: number, withOpening = false) => {
      if (!content) return
      stt.stop()
      stt.reset()
      setTyped('')
      setHelpLevel(0)
      setPhase('ai')
      if (withOpening) await tts.speak(content.opening)
      await tts.speak(content.questions[index].en)
      setPhase('listen')
      if (!typing && stt.supported) stt.start()
    },
    [content, stt, tts, typing],
  )

  async function begin() {
    startedAt.current = Date.now()
    if (stt.supported && !typing) await silence.initMic()
    else if (!stt.supported) setTyping(true)
    askQuestion(0, true)
  }

  async function replay() {
    if (!question) return
    stt.stop()
    setPhase('ai')
    await tts.speak(question.en, 0.8)
    setPhase('listen')
    if (!typing && stt.supported) stt.start()
  }

  // ---- 無音検知 → 段階的に助けを出す ----
  useEffect(() => {
    if (phase !== 'listen') return
    const s = silence.silentSeconds
    if (!answerText) {
      const next = ([3, 2, 1] as const).find((lv) => s >= HELP_THRESHOLDS[lv])
      if (next && next > helpLevel) setHelpLevel(next)
    } else if (!typing && s >= AUTO_SUBMIT_SILENCE) {
      submit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [silence.silentSeconds, phase])

  function askForHelp() {
    setHelpLevel((lv) => (Math.min(3, lv + 1) as HelpLevel))
    silence.bump()
  }

  // ---- 回答を確定してフィードバック ----
  function submit() {
    if (!question || !answerText) return
    stt.stop()
    const feedback = reviewAnswer(answerText, question, helpLevel)
    pushAnswer({ transcript: answerText, helpLevel, feedback })
    setPhase('feedback')
    tts.speak(feedback.words >= 6 ? 'Nice! Great answer.' : 'Good job!')
  }

  function skip() {
    stt.stop()
    pushAnswer({ transcript: '', helpLevel, feedback: null })
    goNext(qIndex + 1)
  }

  function goNext(nextIndex: number) {
    if (nextIndex < total) {
      setQIndex(nextIndex)
      askQuestion(nextIndex)
    } else {
      finish()
    }
  }

  async function finish() {
    if (!habit) return
    setPhase('saving')
    tts.cancel()
    silence.releaseMic()
    const logs = answersRef.current
    const answered = logs.filter((l) => l.feedback)
    const before = await getProfile()
    const session = await addSession({
      habit_id: habit.id,
      answers: answered.length,
      words_spoken: answered.reduce((n, l) => n + (l.feedback?.words ?? 0), 0),
      helps_used: logs.filter((l) => l.helpLevel > 0).length,
      speaking_seconds: Math.round((Date.now() - startedAt.current) / 1000),
      xp: answered.reduce((n, l) => n + (l.feedback?.xp ?? 0), 0) + (answered.length > 0 ? QUEST_CLEAR_BONUS : 0),
    })
    if (answered.length > 0) await upsertCheckin({ habit_id: habit.id, date: today(), status: 'done' })
    navigate(`/result/${session.id}`, { replace: true, state: { prevLevel: before.level } })
  }

  useEffect(
    () => () => {
      tts.cancel()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  if (habit === undefined) return null
  if (habit === null || !content || !question) {
    return (
      <div className="space-y-4 pt-10 text-center">
        <p>クエストが見つかりませんでした</p>
        <Link to="/" className={buttonVariants()}>ホームへ</Link>
      </div>
    )
  }

  const lastFeedback = answers[answers.length - 1]?.feedback
  const mood: AvatarMood =
    phase === 'ai'
      ? 'talking'
      : phase === 'feedback'
        ? 'happy'
        : phase === 'listen' && !answerText && silence.silentSeconds >= HELP_THRESHOLDS[1]
          ? 'thinking'
          : phase === 'listen'
            ? 'listening'
            : 'idle'

  // ---------------- 画面 ----------------

  if (phase === 'intro') {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-5 text-center">
        <Link to="/" className="self-start text-muted-foreground" aria-label="閉じる">
          <X />
        </Link>
        <Avatar level={level} mood="happy" size={170} />
        <div>
          <p className="text-4xl">{habit.emoji}</p>
          <h1 className="text-2xl font-black">{habit.title}</h1>
          <p className="text-sm text-muted-foreground">🎯 {habit.goal}</p>
        </div>
        <Card className="w-full text-left">
          <CardContent className="space-y-2 p-4 text-sm">
            <p>🗣️ AIの質問に英語で答えよう（全{total}問）</p>
            <p>🤫 黙っていても大丈夫。<b>{HELP_THRESHOLDS[1]}秒</b>で日本語ヒント、<b>{HELP_THRESHOLDS[2]}秒</b>で文の型、<b>{HELP_THRESHOLDS[3]}秒</b>で例文が出るよ</p>
            <p>⭐ 話した単語の数だけXPがたまる。助けを使っても減点なし！</p>
          </CardContent>
        </Card>
        {!stt.supported && (
          <p className="text-xs text-muted-foreground">このブラウザは音声認識に未対応のため、キーボードで答えます（Chrome / Safari推奨）</p>
        )}
        <Button size="lg" className="h-14 w-full text-lg" onClick={begin}>
          <Mic className="!size-5" /> はじめる
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col gap-4">
      {/* 進捗 */}
      <div className="flex items-center gap-3">
        <Link to="/" className="text-muted-foreground" aria-label="やめる" onClick={() => tts.cancel()}>
          <X />
        </Link>
        <div className="flex flex-1 gap-1">
          {content.questions.map((_, i) => (
            <div key={i} className={cn('h-2 flex-1 rounded-full', i < qIndex || (i === qIndex && phase === 'feedback') ? 'bg-primary' : i === qIndex ? 'bg-primary/40' : 'bg-secondary')} />
          ))}
        </div>
        <span className="text-xs font-bold text-muted-foreground">{qIndex + 1}/{total}</span>
      </div>

      {/* アバターと質問 */}
      <div className="flex items-end gap-2">
        <Avatar level={level} mood={mood} size={96} animate={phase !== 'listen'} className="shrink-0" />
        <div className="relative mb-6 flex-1 rounded-2xl rounded-bl-sm border bg-card p-4 shadow-sm">
          <p className="font-semibold leading-snug">{question.en}</p>
          <button type="button" onClick={replay} disabled={phase !== 'listen'} className="mt-2 inline-flex items-center gap-1 text-xs text-primary disabled:opacity-40">
            <Volume2 className="h-3.5 w-3.5" /> ゆっくりもう一度
          </button>
        </div>
      </div>

      {/* 助け（段階的に開く） */}
      {phase === 'listen' && helpLevel > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="space-y-3 p-4 text-sm">
            <p className="flex items-center gap-1 text-xs font-bold text-amber-700">
              <LifeBuoy className="h-4 w-4" /> ボイからの助け
            </p>
            <div>
              <p className="font-bold">💡 {question.ja}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {question.keywords.map((k) => (
                  <span key={k} className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-amber-800 shadow-sm">{k}</span>
                ))}
              </div>
            </div>
            {helpLevel >= 2 && (
              <div>
                <p className="text-xs text-amber-700">この型で言ってみよう</p>
                <p className="font-mono font-bold">{question.pattern}</p>
              </div>
            )}
            {helpLevel >= 3 && (
              <div>
                <p className="text-xs text-amber-700">そのまま読んでもOK</p>
                <p className="font-bold">"{question.example}"</p>
                <button type="button" onClick={() => tts.speak(question.example, 0.8)} className="mt-1 inline-flex items-center gap-1 text-xs text-primary">
                  <Volume2 className="h-3.5 w-3.5" /> お手本を聞く
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* フィードバック */}
      {phase === 'feedback' && lastFeedback && (
        <Card className="border-primary/40">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-lg font-black">{lastFeedback.praise}</p>
              <span className="rounded-full bg-primary px-3 py-1 text-sm font-black text-primary-foreground">+{lastFeedback.xp} XP</span>
            </div>
            <div className="rounded-lg bg-secondary p-3 text-sm">
              <p className="text-xs text-muted-foreground">あなたの答え（{lastFeedback.words}語）</p>
              <p className="font-medium">{answers[answers.length - 1].transcript}</p>
            </div>
            {lastFeedback.tips.length > 0 && (
              <ul className="space-y-1 text-sm">
                {lastFeedback.tips.map((tip) => <li key={tip}>・{tip}</li>)}
              </ul>
            )}
            <div className="text-sm">
              <p className="text-xs text-muted-foreground">こんな言い方もできるよ</p>
              <p className="font-semibold">"{question.example}"</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex-1" />

      {/* 入力エリア */}
      {phase === 'listen' && (
        <div className="space-y-3">
          {typing ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
            >
              <Input
                autoFocus
                value={typed}
                onChange={(e) => {
                  setTyped(e.target.value)
                  silence.bump()
                }}
                placeholder="英語で答えを入力"
              />
              <Button type="submit" disabled={!typed.trim()}>送信</Button>
            </form>
          ) : (
            <div className="rounded-2xl border-2 border-primary/30 bg-card p-4">
              <div className="mb-1 flex items-center gap-2 text-xs font-bold text-primary">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                </span>
                聞いています…
                {!answerText && silence.silentSeconds >= 2 && (
                  <span className="ml-auto font-normal text-muted-foreground">考え中 {silence.silentSeconds}秒</span>
                )}
              </div>
              <p className={cn('min-h-[3rem] text-lg', !answerText && 'text-muted-foreground')}>
                {answerText || '英語で話してみよう'}
              </p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" onClick={askForHelp} disabled={helpLevel >= 3}>
              <LifeBuoy /> 助けて
            </Button>
            <Button variant="outline" onClick={skip}>
              <SkipForward /> スキップ
            </Button>
            {stt.supported ? (
              <Button
                variant="outline"
                onClick={() => {
                  if (typing) {
                    setTyping(false)
                    stt.start()
                  } else {
                    stt.stop()
                    setTyping(true)
                  }
                }}
              >
                {typing ? <><Mic /> 声で</> : <><Keyboard /> 文字で</>}
              </Button>
            ) : (
              <span />
            )}
          </div>
          {!typing && (
            <Button size="lg" className="w-full" disabled={!answerText} onClick={submit}>
              言い終わった
            </Button>
          )}
        </div>
      )}

      {phase === 'ai' && <p className="text-center text-sm text-muted-foreground">ボイが話しています…</p>}

      {phase === 'feedback' && (
        <Button size="lg" className="h-14 w-full text-lg" onClick={() => goNext(qIndex + 1)}>
          {qIndex + 1 < total ? '次の質問へ' : '結果を見る'}
        </Button>
      )}

      {phase === 'saving' && <p className="text-center text-sm text-muted-foreground">記録しています…</p>}
    </div>
  )
}
