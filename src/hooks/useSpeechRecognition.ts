import { useCallback, useEffect, useRef, useState } from 'react'

/* Web Speech API の最小限の型（TSのDOM型に含まれないため） */
interface SpeechRecognitionResultLike {
  isFinal: boolean
  0: { transcript: string }
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/** 音声認識AIのMVP版：ブラウザ内蔵の SpeechRecognition を使う */
export function useSpeechRecognition(opts: { onActivity?: () => void; onError?: (error: string) => void } = {}) {
  const Ctor = getCtor()
  const supported = Ctor !== null
  const [listening, setListening] = useState(false)
  const [finalText, setFinalText] = useState('')
  const [interimText, setInterimText] = useState('')
  const recRef = useRef<SpeechRecognitionLike | null>(null)
  const wantRef = useRef(false)
  const optsRef = useRef(opts)
  const startRef = useRef<() => void>(() => {})
  useEffect(() => {
    optsRef.current = opts
  })

  const start = useCallback(() => {
    if (!Ctor) return
    wantRef.current = true
    if (recRef.current) return
    const rec = new Ctor()
    rec.lang = 'en-US'
    rec.continuous = true
    rec.interimResults = true
    rec.onresult = (e) => {
      let interim = ''
      let finals = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finals += r[0].transcript + ' '
        else interim += r[0].transcript
      }
      if (finals) setFinalText((t) => (t + ' ' + finals).replace(/\s+/g, ' ').trimStart())
      setInterimText(interim)
      optsRef.current.onActivity?.()
    }
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return
      optsRef.current.onError?.(e.error)
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') wantRef.current = false
    }
    rec.onend = () => {
      recRef.current = null
      // ブラウザが勝手に止めた場合は再開する
      if (wantRef.current) {
        window.setTimeout(() => wantRef.current && startRef.current(), 150)
      } else {
        setListening(false)
      }
    }
    recRef.current = rec
    try {
      rec.start()
      setListening(true)
    } catch {
      recRef.current = null
    }
  }, [Ctor])

  useEffect(() => {
    startRef.current = start
  }, [start])

  const stop = useCallback(() => {
    wantRef.current = false
    recRef.current?.stop()
    setListening(false)
  }, [])

  const reset = useCallback(() => {
    setFinalText('')
    setInterimText('')
  }, [])

  useEffect(
    () => () => {
      wantRef.current = false
      recRef.current?.abort()
    },
    [],
  )

  const transcript = (finalText + ' ' + interimText).replace(/\s+/g, ' ').trim()

  return { supported, listening, transcript, start, stop, reset }
}
