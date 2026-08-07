import { useEffect, useRef, useState } from 'react'
import { KeyboardIcon, Loader2, Mic, X, SendHorizonal } from 'lucide-react'
import { useInterviewRecorder } from '@/hooks/useInterviewRecorder'
import { useLiveInterviewStt } from '@/hooks/useLiveInterviewStt'
import { encodeWavFromBlob } from '@/lib/audio/encodeWav'
import type { SubmitInterviewAnswerInput } from '@/lib/api/interviews/interviewsApi'
import { USE_LIVE_STT } from '@/lib/interviews/liveSttConfig'
import { LiveWaveform } from './LiveWaveform'
import { Button } from '@/components/ui/button'

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function AnswerRecorder({
  sessionId,
  isSubmitting,
  onSubmit,
}: {
  sessionId: number | string
  isSubmitting: boolean
  onSubmit: (answer: SubmitInterviewAnswerInput) => Promise<void>
}) {
  const recorder = useInterviewRecorder()
  const liveStt = useLiveInterviewStt(sessionId)
  const [isEncoding, setIsEncoding] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [typedMode, setTypedMode] = useState(false)
  const [typedAnswer, setTypedAnswer] = useState('')
  const [frozenSeconds, setFrozenSeconds] = useState(0)
  const sttStartedRef = useRef(false)

  const busy = isSubmitting || isEncoding || isSending

  // Starts the live STT session once the mic stream shows up on a render
  // after `startRecording()` resolves — `recorder.mediaStream` is still null
  // in the same tick `startRecording()` returns, so this can't just happen
  // inline in `handleStartRecording`.
  useEffect(() => {
    if (!USE_LIVE_STT) return
    if (recorder.state === 'recording' && recorder.mediaStream) {
      if (sttStartedRef.current) return
      sttStartedRef.current = true
      liveStt.start(recorder.mediaStream).catch((error: unknown) => {
        console.error('Failed to start live interview STT session', error)
      })
    } else {
      sttStartedRef.current = false
    }
  }, [recorder.state, recorder.mediaStream, liveStt])

  async function handleStartRecording() {
    const started = await recorder.startRecording()
    if (!started) setTypedMode(true)
  }

  async function handleDiscard() {
    if (USE_LIVE_STT) liveStt.cancel()
    recorder.stopAndDiscard()
  }

  async function handleSend() {
    if (busy) return
    // Flips the button into its sending state synchronously, before any of
    // the awaits below — otherwise the UI stays untouched (and clickable)
    // while `stopAndSubmit`/`liveStt.stop()` are in flight, which is what let
    // a click look like it did nothing (or let a second click race the first).
    setIsSending(true)
    setFrozenSeconds(recorder.seconds)

    try {
      if (USE_LIVE_STT) {
        // Order matters: `stop()` sends the commit and awaits the final
        // transcript segment over the still-live mic track — only stop the
        // MediaRecorder (which kills that same track) once that's done.
        const transcript = await liveStt.stop()
        await recorder.stopAndSubmit()
        if (!transcript) return
        await onSubmit({ kind: 'transcribed', text: transcript })
        return
      }

      const blob = await recorder.stopAndSubmit()
      if (!blob) return
      setIsEncoding(true)
      try {
        const wavBlob = await encodeWavFromBlob(blob)
        await onSubmit({ kind: 'audio', blob: wavBlob })
      } finally {
        setIsEncoding(false)
      }
    } finally {
      setIsSending(false)
    }
  }

  async function handleSubmitTyped() {
    const text = typedAnswer.trim()
    if (!text || busy) return
    await onSubmit({ kind: 'typed', text })
    setTypedAnswer('')
  }

  if (typedMode) {
    return (
      <div className="flex w-full flex-col gap-2">
        <textarea
          value={typedAnswer}
          onChange={(e) => setTypedAnswer(e.target.value)}
          disabled={busy}
          name="Answer"
          placeholder="Type your answer…"
          rows={3}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          className="w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-brand focus:outline-none disabled:opacity-60 sm:text-base"
        />
        <div className="flex items-center gap-3 px-1">
          {!recorder.permissionDenied ? (
            <Button
              type="button"
              onClick={() => {
                setTypedMode(false)
                void handleStartRecording()
              }}
              variant="outline"
            >
              Record instead
              <Mic />
            </Button>
          ) : null}
          <div className="flex-1" />
          <button
            type="button"
            data-testid="interview-submit-answer"
            onClick={() => void handleSubmitTyped()}
            disabled={busy || !typedAnswer.trim()}
            className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {isSubmitting ? 'Submitting…' : 'Submit answer'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      {recorder.state === 'recording' || busy ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            data-testid="interview-record-button"
            onClick={() => void handleDiscard()}
            disabled={busy}
            aria-label="Discard recording"
          >
            <X size={16} fill="currentColor" />
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-border bg-background px-3 py-1.5">
            {recorder.state === 'recording' && recorder.mediaStream ? (
              <LiveWaveform mediaStream={recorder.mediaStream} />
            ) : (
              <span className="flex-1 text-sm text-foreground-muted">
                Submitting…
              </span>
            )}
            <span className="shrink-0 text-sm font-medium tabular-nums text-danger w-12">
              {formatDuration(
                recorder.state === 'recording'
                  ? recorder.seconds
                  : frozenSeconds,
              )}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon-sm"
            data-testid="interview-submit-answer"
            onClick={() => void handleSend()}
            disabled={busy}
            aria-label={busy ? 'Submitting' : 'Send recording'}
          >
            {busy ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <SendHorizonal />
            )}
          </Button>
        </>
      ) : (
        <>
          <Button
            type="button"
            data-testid="interview-type-instead"
            onClick={() => setTypedMode(true)}
            variant="ghost"
          >
            <KeyboardIcon />
          </Button>
          <Button
            type="button"
            data-testid="interview-record-button"
            onClick={() => void handleStartRecording()}
            aria-label="Start recording your answer"
          >
            <Mic size={18} />
            Record your answer
          </Button>
        </>
      )}
    </div>
  )
}
