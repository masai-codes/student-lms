import { useEffect, useRef, useState } from 'react'
import { Check, Loader2, Mic, Volume2, X } from 'lucide-react'
import { useInterviewRecorder } from '@/hooks/useInterviewRecorder'
import { useLiveInterviewStt } from '@/hooks/useLiveInterviewStt'
import type { SubmitInterviewAnswerInput } from '@/lib/api/interviews/interviewsApi'
import { INTERVIEW_SEND_PARTIAL_TRANSCRIPT_ON_SUBMIT } from '@/lib/interviews/interviewConstants'
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
  const [isSending, setIsSending] = useState(false)
  const [isConnectingStt, setIsConnectingStt] = useState(false)
  const [typedMode, setTypedMode] = useState(false)
  const [typedAnswer, setTypedAnswer] = useState('')
  const [frozenSeconds, setFrozenSeconds] = useState(0)
  const sttStartedRef = useRef(false)

  const busy = isSubmitting || isSending
  const isRecording = recorder.state === 'recording'
  // The record pill shows as soon as the mic opens, but audio sent before the
  // STT session finishes connecting is never transcribed — treat that window
  // as its own "connecting" state so the candidate doesn't start talking into
  // a mic that isn't listening yet.
  const isPreparing = isRecording && isConnectingStt

  // Starts the live STT session once the mic stream shows up on a render
  // after `startRecording()` resolves — `recorder.mediaStream` is still null
  // in the same tick `startRecording()` returns, so this can't just happen
  // inline in `handleStartRecording`. If STT can't start, fall back to typed
  // input rather than recording an answer that can never be transcribed.
  useEffect(() => {
    if (recorder.state === 'recording' && recorder.mediaStream) {
      if (sttStartedRef.current) return
      sttStartedRef.current = true
      setIsConnectingStt(true)
      liveStt
        .start(recorder.mediaStream)
        .catch((error: unknown) => {
          console.error('Failed to start live interview STT session', error)
          recorder.stopAndDiscard()
          setTypedMode(true)
        })
        .finally(() => setIsConnectingStt(false))
    } else {
      sttStartedRef.current = false
    }
  }, [recorder.state, recorder.mediaStream, liveStt])

  async function handleStartRecording() {
    const started = await recorder.startRecording()
    if (!started) setTypedMode(true)
  }

  async function handleDiscard() {
    liveStt.cancel()
    recorder.stopAndDiscard()
  }

  async function handleSend() {
    if (busy || isPreparing) return
    // Flips the button into its sending state synchronously, before any of
    // the awaits below — otherwise the UI stays untouched (and clickable)
    // while `stopAndSubmit`/`liveStt.stop()` are in flight, which is what let
    // a click look like it did nothing (or let a second click race the first).
    setIsSending(true)
    setFrozenSeconds(recorder.seconds)

    try {
      let transcript: string
      if (INTERVIEW_SEND_PARTIAL_TRANSCRIPT_ON_SUBMIT) {
        // Grab whatever's already been transcribed and submit right away —
        // tear the STT session and MediaRecorder down in the background
        // rather than blocking the turn request on their teardown.
        transcript = liveStt.partialTranscript
        void liveStt.stop()
        void recorder.stopAndSubmit()
      } else {
        // Order doesn't actually matter between these two — run them
        // concurrently instead of serializing the (up to ~5s) transcript
        // commit ahead of the (near-instant) MediaRecorder flush.
        const [finalTranscript] = await Promise.all([
          liveStt.stop(),
          recorder.stopAndSubmit(),
        ])
        transcript = finalTranscript
      }
      if (!transcript) return
      await onSubmit({ kind: 'transcribed', text: transcript })
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

  const roleLabel = (
    <div className="flex items-center gap-2 self-start pl-1">
      <span className="size-1.5 rounded-full bg-foreground-subtle" />
      <span className="type-b3-md text-foreground-subtle uppercase tracking-wider">
        You
      </span>
    </div>
  )

  if (typedMode) {
    return (
      <div className="flex w-full flex-col gap-3">
        {roleLabel}
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
      {roleLabel}
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
          ) : isPreparing ? (
            <span className="flex flex-1 items-center gap-2 text-sm text-foreground-muted">
              <Loader2 className="animate-spin" size={14} />
              Connecting…
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
          disabled={(busy || isPreparing) && !isSpeaking}
          aria-label={
            isSpeaking
              ? 'Stop AI speaking'
              : busy
                ? 'Submitting'
                : isPreparing
                  ? 'Connecting'
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
          ) : busy || isPreparing ? (
            <Loader2 className="animate-spin" size={22} />
          ) : isRecording ? (
            <Check size={22} />
          ) : (
            <Mic size={22} />
          )}
        </button>
      </div>

      {isRecording && !isPreparing ? (
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
