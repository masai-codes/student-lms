import { useEffect, useRef, useState } from 'react'
import { Check, Loader2, Mic, Volume2, X } from 'lucide-react'
import { useInterviewRecorder } from '@/hooks/useInterviewRecorder'
import { useLiveInterviewStt } from '@/hooks/useLiveInterviewStt'
import { encodeWavFromBlob } from '@/lib/audio/encodeWav'
import type { SubmitInterviewAnswerInput } from '@/lib/api/interviews/interviewsApi'
import { USE_LIVE_STT } from '@/lib/interviews/liveSttConfig'
import { LiveWaveform } from './LiveWaveform'

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** Single-line live transcript, always scrolled to show the most recently
 * spoken words rather than wrapping or growing taller as it fills up. */
function LiveTranscriptLine({ text }: { text: string }) {
  const lineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = lineRef.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [text])

  if (!text) return null

  return (
    <div
      ref={lineRef}
      data-testid="interview-live-transcript"
      className="w-full max-w-xl overflow-x-hidden whitespace-nowrap text-center text-sm text-foreground-muted"
    >
      {text}
    </div>
  )
}

export function AnswerRecorder({
  sessionId,
  isSubmitting,
  isSpeaking = false,
  onStopSpeaking = () => {},
  onSubmit,
}: {
  sessionId: number | string
  isSubmitting: boolean
  /** True once the interviewer's spoken response has started streaming back —
   * lets the submit spinner hand off to a "stop speaking" control instead of
   * staying in an indefinite loading state for the whole response. */
  isSpeaking?: boolean
  onStopSpeaking?: () => void
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
  const isRecording = recorder.state === 'recording'

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
            <button
              type="button"
              onClick={() => {
                setTypedMode(false)
                void handleStartRecording()
              }}
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted"
            >
              Record instead
              <Mic size={16} />
            </button>
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
    <div className="flex w-full flex-col items-center gap-3">
      <div
        data-testid="interview-record-pill"
        data-recording={isRecording || busy ? 'true' : 'false'}
        className={`flex items-center rounded-full border p-1 transition-all duration-500 ${
          isRecording || busy
            ? 'w-full max-w-xl border-border bg-background shadow-sm'
            : 'w-16 border-transparent bg-transparent'
        }`}
      >
        <button
          type="button"
          onClick={() => void handleDiscard()}
          disabled={busy}
          aria-label="Discard recording"
          className={`flex shrink-0 items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full px-0 text-sm text-foreground-muted transition-all duration-500 hover:bg-surface-muted disabled:pointer-events-none ${
            isRecording
              ? 'max-w-[7rem] px-3 py-3 opacity-100'
              : 'max-w-0 opacity-0'
          }`}
        >
          <X size={15} />
          Cancel
        </button>

        <div
          className={`flex min-w-0 flex-1 items-center gap-3 overflow-hidden transition-all duration-500 ${
            isRecording || busy
              ? 'max-w-full min-w-[120px] px-3 opacity-100'
              : 'max-w-0 opacity-0'
          }`}
        >
          {isSpeaking ? (
            <span className="flex-1 text-sm text-foreground-muted">
              Speaking…
            </span>
          ) : (
            <>
              <div className="size-2 shrink-0 animate-pulse rounded-full bg-danger" />
              <span className="shrink-0 text-sm font-medium tabular-nums text-foreground-muted">
                {formatDuration(isRecording ? recorder.seconds : frozenSeconds)}
              </span>
              {isRecording && recorder.mediaStream ? (
                <LiveWaveform mediaStream={recorder.mediaStream} />
              ) : (
                <span className="flex-1 text-sm text-foreground-muted">
                  Submitting…
                </span>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          data-testid={
            isSpeaking
              ? 'interview-stop-speaking'
              : isRecording
                ? 'interview-submit-answer'
                : 'interview-record-button'
          }
          onClick={() => {
            if (isSpeaking) {
              onStopSpeaking()
              return
            }
            void (isRecording ? handleSend() : handleStartRecording())
          }}
          disabled={busy && !isSpeaking}
          aria-label={
            isSpeaking
              ? 'Stop AI speaking'
              : busy
                ? 'Submitting'
                : isRecording
                  ? 'Submit your answer'
                  : 'Start recording your answer'
          }
          className="relative flex size-14 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground shadow-md transition-transform active:scale-95 disabled:opacity-70"
        >
          {!(isRecording || busy) ? (
            <span className="absolute inset-0 rounded-full bg-brand/40 animate-ping" />
          ) : null}
          {isSpeaking ? (
            <Volume2 size={22} />
          ) : busy ? (
            <Loader2 className="animate-spin" size={22} />
          ) : isRecording ? (
            <Check size={22} />
          ) : (
            <Mic size={22} />
          )}
        </button>
      </div>

      {USE_LIVE_STT && isRecording ? (
        <LiveTranscriptLine text={liveStt.partialTranscript} />
      ) : null}

      <div
        className={`flex flex-col items-center gap-2 transition-opacity duration-300 ${
          isRecording || busy ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <span className="text-sm font-semibold text-foreground">
          Tap to record
        </span>
        <button
          type="button"
          data-testid="interview-type-instead"
          onClick={() => setTypedMode(true)}
          className="text-sm text-foreground-muted underline underline-offset-4 hover:text-foreground"
        >
          or type your answer instead
        </button>
      </div>
    </div>
  )
}
