import { useCallback, useEffect, useRef, useState } from 'react'

/** 音声合成AIのMVP版：ブラウザ内蔵の speechSynthesis を使う */
export function useSpeechSynthesis() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const [speaking, setSpeaking] = useState(false)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    if (!supported) return
    const pick = () => {
      const voices = window.speechSynthesis.getVoices()
      voiceRef.current =
        voices.find((v) => v.lang === 'en-US' && /Samantha|Google US English|Jenny|Aria/i.test(v.name)) ??
        voices.find((v) => v.lang === 'en-US') ??
        voices.find((v) => v.lang.startsWith('en')) ??
        null
    }
    pick()
    window.speechSynthesis.addEventListener('voiceschanged', pick)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', pick)
      window.speechSynthesis.cancel()
    }
  }, [supported])

  const speak = useCallback(
    (text: string, rate = 0.92): Promise<void> =>
      new Promise((resolve) => {
        if (!supported) return resolve()
        window.speechSynthesis.cancel()
        const u = new SpeechSynthesisUtterance(text)
        u.lang = 'en-US'
        u.rate = rate
        if (voiceRef.current) u.voice = voiceRef.current
        // 音声が出ない環境でも止まらないよう、文字数から上限時間を決めておく
        const timeout = window.setTimeout(done, 1500 + text.length * 90)
        function done() {
          window.clearTimeout(timeout)
          setSpeaking(false)
          resolve()
        }
        u.onend = done
        u.onerror = done
        setSpeaking(true)
        window.speechSynthesis.speak(u)
      }),
    [supported],
  )

  const cancel = useCallback(() => {
    if (supported) window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [supported])

  return { supported, speaking, speak, cancel }
}
