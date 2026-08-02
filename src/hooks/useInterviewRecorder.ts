import { useEffect, useRef, useState } from 'react'
import type WaveSurfer from 'wavesurfer.js'

export type InterviewRecorderState = 'idle' | 'recording' | 'recorded'

export interface UseInterviewRecorderResult {
  state: InterviewRecorderState
  seconds: number
  audioBlob: Blob | null
  permissionDenied: boolean
  isPlaying: boolean
  waveformRef: React.RefObject<HTMLDivElement | null>
  startRecording: () => Promise<void>
  stopRecording: () => void
  discardRecording: () => void
  togglePlayback: () => void
}

/**
 * Record → stop → preview (waveform) → discard/re-record state machine,
 * shared by the announcements voice-note composer and the interview
 * recorder. `permissionDenied` flips true on a `getUserMedia` rejection so
 * callers can fall back to a typed-answer UI instead of just toasting.
 */
export function useInterviewRecorder(): UseInterviewRecorderResult {
  const [state, setState] = useState<InterviewRecorderState>('idle')
  const [seconds, setSeconds] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Array<BlobPart>>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const waveformRef = useRef<HTMLDivElement>(null)
  const waveSurferRef = useRef<InstanceType<typeof WaveSurfer> | null>(null)
  const blobUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (!audioBlob || !waveformRef.current) return

    const blobUrl = URL.createObjectURL(audioBlob)
    blobUrlRef.current = blobUrl
    let cancelled = false

    void import('wavesurfer.js').then(({ default: WaveSurfer }) => {
      if (cancelled || !waveformRef.current) return
      const ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#1E3A8A',
        progressColor: '#7164E9',
        barHeight: 1.4,
        height: 48,
      })
      ws.load(blobUrl)
      ws.on('finish', () => setIsPlaying(false))
      waveSurferRef.current = ws
    })

    return () => {
      cancelled = true
      waveSurferRef.current?.destroy()
      waveSurferRef.current = null
      URL.revokeObjectURL(blobUrl)
      blobUrlRef.current = null
    }
  }, [audioBlob])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        setAudioBlob(blob)
        setState('recorded')
        stream.getTracks().forEach((track) => track.stop())
        if (timerRef.current) clearInterval(timerRef.current)
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setState('recording')
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } catch {
      setPermissionDenied(true)
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
  }

  function discardRecording() {
    mediaRecorderRef.current?.stop()
    setAudioBlob(null)
    setState('idle')
    setSeconds(0)
    setIsPlaying(false)
    waveSurferRef.current?.destroy()
    waveSurferRef.current = null
  }

  function togglePlayback() {
    waveSurferRef.current?.playPause()
    setIsPlaying((p) => !p)
  }

  return {
    state,
    seconds,
    audioBlob,
    permissionDenied,
    isPlaying,
    waveformRef,
    startRecording,
    stopRecording,
    discardRecording,
    togglePlayback,
  }
}
