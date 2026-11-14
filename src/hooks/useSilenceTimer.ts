import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 無音検知：マイクの音量を見て、黙っている秒数を数える。
 * マイクが使えない環境では bump()（音声認識の結果が来たとき等）だけでリセットする。
 */
export function useSilenceTimer(enabled: boolean, threshold = 0.025) {
  const [silentSeconds, setSilentSeconds] = useState(0)
  const [micReady, setMicReady] = useState(false)
  const lastSoundRef = useRef(Date.now())
  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const bump = useCallback(() => {
    lastSoundRef.current = Date.now()
    setSilentSeconds(0)
  }, [])

  /** マイクを準備（ユーザー操作の中で呼ぶ） */
  const initMic = useCallback(async () => {
    if (analyserRef.current) return true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new Ctx()
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      src.connect(analyser)
      streamRef.current = stream
      ctxRef.current = ctx
      analyserRef.current = analyser
      setMicReady(true)
      return true
    } catch {
      setMicReady(false)
      return false
    }
  }, [])

  const releaseMic = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    ctxRef.current?.close().catch(() => {})
    streamRef.current = null
    ctxRef.current = null
    analyserRef.current = null
    setMicReady(false)
  }, [])

  useEffect(() => {
    if (!enabled) return
    lastSoundRef.current = Date.now()
    setSilentSeconds(0)
    const buf = new Float32Array(1024)
    const id = window.setInterval(() => {
      const analyser = analyserRef.current
      if (analyser) {
        if (ctxRef.current?.state === 'suspended') ctxRef.current.resume().catch(() => {})
        analyser.getFloatTimeDomainData(buf)
        let sum = 0
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i]
        const rms = Math.sqrt(sum / buf.length)
        if (rms > threshold) lastSoundRef.current = Date.now()
      }
      setSilentSeconds(Math.floor((Date.now() - lastSoundRef.current) / 1000))
    }, 250)
    return () => window.clearInterval(id)
  }, [enabled, threshold])

  useEffect(() => releaseMic, [releaseMic])

  return { silentSeconds, micReady, bump, initMic, releaseMic }
}
