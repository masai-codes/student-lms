import { useEffect, useState } from 'react'
import { Check, Mic, Pause, Play, Square, X } from 'lucide-react'
import { useInterviewRecorder } from '@/hooks/useInterviewRecorder'
import { encodeWavFromBlob } from '@/lib/audio/encodeWav'
import type { SubmitInterviewAnswerInput } from '@/lib/api/interviews/interviewsApi'

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

  useEffect(() => {
    if (recorder.permissionDenied) setTypedMode(true)
  }, [recorder.permissionDenied])

  const busy = isSubmitting || isEncoding

  async function handleSubmitRecording() {
    if (!recorder.audioBlob) return
    setIsEncoding(true)
    try {
      const wavBlob = await encodeWavFromBlob(recorder.audioBlob)
      await onSubmit({ kind: 'audio', blob: wavBlob })
      recorder.discardRecording()
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
      <div className="flex flex-col gap-3">
        <textarea
          value={typedAnswer}
          onChange={(e) => setTypedAnswer(e.target.value)}
          disabled={busy}
          placeholder="Type your answer…"
          rows={5}
          className="w-full rounded-xl border border-border bg-surface p-3 text-sm text-foreground disabled:opacity-60"
        />
        <div className="flex items-center gap-2">
          {!recorder.permissionDenied ? (
            <button
              type="button"
              onClick={() => setTypedMode(false)}
              className="text-sm text-foreground-muted hover:text-foreground"
            >
              Record instead
            </button>
          ) : null}
          <div className="flex-1" />
          <button
            type="button"
            data-testid="interview-submit-answer"
            onClick={() => void handleSubmitTyped()}
            disabled={busy || !typedAnswer.trim()}
            className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {isSubmitting ? 'Submitting…' : 'Submit answer'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {recorder.state === 'idle' ? (
          <button
            type="button"
            data-testid="interview-record-button"
            onClick={() => void recorder.startRecording()}
            className="flex items-center justify-center size-10 rounded-lg bg-brand text-brand-foreground hover:opacity-90"
            aria-label="Start recording your answer"
          >
            <Mic size={18} />
          </button>
        ) : null}

        {recorder.state === 'recording' ? (
          <>
            <button
              type="button"
              data-testid="interview-record-button"
              onClick={recorder.stopRecording}
              className="flex items-center justify-center size-10 rounded-lg bg-brand text-brand-foreground animate-pulse"
              aria-label="Stop recording"
            >
              <Square size={18} />
            </button>
            <span className="flex items-center gap-2 text-sm font-medium text-danger">
              <span className="size-2 rounded-full bg-danger animate-pulse" />
              Recording…
            </span>
          </>
        ) : null}

        {recorder.state === 'recorded' ? (
          <>
            <div
              ref={recorder.waveformRef}
              className="h-11 w-[200px] shrink-0 overflow-hidden rounded-lg border border-border bg-surface-muted"
            />
            <button
              type="button"
              onClick={recorder.togglePlayback}
              className="flex items-center justify-center size-10 rounded-lg bg-surface-muted text-foreground hover:bg-surface"
              aria-label={recorder.isPlaying ? 'Pause' : 'Play'}
            >
              {recorder.isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button
              type="button"
              onClick={recorder.discardRecording}
              disabled={busy}
              className="flex items-center justify-center size-10 rounded-lg bg-danger-subtle text-danger hover:opacity-90 disabled:opacity-50"
              aria-label="Discard recording"
            >
              <X size={18} />
            </button>
            <button
              type="button"
              data-testid="interview-submit-answer"
              onClick={() => void handleSubmitRecording()}
              disabled={busy}
              className="flex items-center gap-1.5 rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Check size={16} />
              {isEncoding
                ? 'Encoding…'
                : isSubmitting
                  ? 'Submitting…'
                  : 'Submit answer'}
            </button>
          </>
        ) : null}

        <div className="flex-1" />
        <button
          type="button"
          data-testid="interview-type-instead"
          onClick={() => setTypedMode(true)}
          className="text-sm text-foreground-muted hover:text-foreground"
        >
          Type instead
        </button>
      </div>
    </div>
  )
}
