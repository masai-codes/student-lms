import { useState } from 'react'
import { KeyboardIcon, Loader2, Mic, X, SendHorizonal } from 'lucide-react'
import { useInterviewRecorder } from '@/hooks/useInterviewRecorder'
import { encodeWavFromBlob } from '@/lib/audio/encodeWav'
import type { SubmitInterviewAnswerInput } from '@/lib/api/interviews/interviewsApi'
import { LiveWaveform } from './LiveWaveform'
import { Button } from '@/components/ui/button'

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function AnswerRecorder({
  isSubmitting,
  onSubmit,
}: {
  isSubmitting: boolean
  onSubmit: (answer: SubmitInterviewAnswerInput) => Promise<void>
}) {
  const recorder = useInterviewRecorder()
  const [isEncoding, setIsEncoding] = useState(false)
  const [typedMode, setTypedMode] = useState(false)
  const [typedAnswer, setTypedAnswer] = useState('')
  const [frozenSeconds, setFrozenSeconds] = useState(0)

  const busy = isSubmitting || isEncoding

  async function handleStartRecording() {
    const started = await recorder.startRecording()
    if (!started) setTypedMode(true)
  }

  async function handleSend() {
    setFrozenSeconds(recorder.seconds)
    const blob = await recorder.stopAndSubmit()
    if (!blob) return
    setIsEncoding(true)
    try {
      const wavBlob = await encodeWavFromBlob(blob)
      await onSubmit({ kind: 'audio', blob: wavBlob })
    } finally {
      setIsEncoding(false)
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
            onClick={() => recorder.stopAndDiscard()}
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
