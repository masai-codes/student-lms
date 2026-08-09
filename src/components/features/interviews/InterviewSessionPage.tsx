import { useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useInterviewSession } from '@/hooks/useInterviewSession'
import { abandonInterviewSession } from '@/lib/api/interviews/interviewsApi'
import { getOrCreateInterviewSttToken } from '@/lib/api/interviews/sttTokenCache'
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/ui/modal'
import { AnswerRecorder } from './AnswerRecorder'
import { InterviewReportCard } from './InterviewReportCard'
import { InterviewTimeline } from './InterviewTimeline'

function InterviewSessionSkeleton() {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-2xl flex-col items-center justify-center gap-4 py-8">
      <div className="mb-4 h-4 w-40 animate-pulse rounded bg-surface-muted" />
      <div className="mb-6 h-8 w-full animate-pulse rounded bg-surface-muted" />
      <div className="h-10 w-64 animate-pulse rounded bg-surface-muted" />
    </div>
  )
}

function EndInterviewButton({ sessionId }: { sessionId: number }) {
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isEnding, setIsEnding] = useState(false)

  async function handleConfirmEnd() {
    setIsEnding(true)
    try {
      await abandonInterviewSession(sessionId)
    } catch (error) {
      console.error('Failed to abandon interview session', error)
    } finally {
      await navigate({ to: '/interviews' })
    }
  }

  return (
    <>
      <button
        type="button"
        data-testid="interview-end-button"
        aria-label="End interview"
        onClick={() => setConfirmOpen(true)}
        className="absolute right-4 top-4 z-10 flex size-9 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
      >
        <X size={20} />
      </button>

      <Modal open={confirmOpen} onOpenChange={setConfirmOpen}>
        <ModalContent
          showCloseButton={false}
          data-testid="interview-end-confirm-dialog"
        >
          <ModalTitle>End this interview?</ModalTitle>
          <ModalDescription>
            Your progress on this interview will be lost. You can start a new
            one anytime.
          </ModalDescription>
          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={isEnding}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted disabled:opacity-60"
            >
              Keep going
            </button>
            <button
              type="button"
              data-testid="interview-end-confirm"
              onClick={() => void handleConfirmEnd()}
              disabled={isEnding}
              className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-danger-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isEnding ? 'Ending…' : 'End interview'}
            </button>
          </div>
        </ModalContent>
      </Modal>
    </>
  )
}

export function InterviewSessionPage({ sessionId }: { sessionId: number }) {
  const {
    session,
    isLoading,
    isError,
    isSubmitting,
    isSpeaking,
    error,
    submitAnswer,
    stopSpeaking,
    clearError,
  } = useInterviewSession(sessionId)

  // Mints (or reuses a still-valid cached) STT client secret as soon as an
  // in-progress session loads, so it's already available by the time the
  // first answer is recorded instead of being fetched mid-turn.
  useEffect(() => {
    if (session?.status !== 'in_progress') return
    getOrCreateInterviewSttToken(sessionId).catch((sttError: unknown) => {
      console.error('Failed to prefetch interview STT token', sttError)
    })
  }, [session?.status, sessionId])

  if (isLoading) return <InterviewSessionSkeleton />

  if (isError || !session) {
    return (
      <div className="mx-auto w-full max-w-2xl py-8">
        <p className="text-sm text-foreground-muted">
          Couldn't load this interview session. Please go back and try again.
        </p>
      </div>
    )
  }

  if (session.status === 'completed' && session.report) {
    return (
      <InterviewReportCard
        topicLabel={session.topicLabel}
        report={session.report}
        turns={session.turns}
      />
    )
  }

  // Each planned question carries a fixed `question` text (all pre-generated
  // at session creation) — the currently pending one is whichever hasn't
  // been fully answered (main answer + any follow-ups) yet. If its last
  // follow-up is still unanswered, that follow-up's prompt is what the
  // candidate is actually responding to right now.
  const pendingTurn =
    session.turns.find((turn) => turn.answeredAt === '') ?? session.turns.at(-1)
  const pendingFollowUp =
    pendingTurn && pendingTurn.transcript !== ''
      ? pendingTurn.followUps.at(-1)
      : null
  const questionNumber = (pendingTurn?.questionIndex ?? 0) + 1
  const followUpQuestion =
    pendingFollowUp && pendingFollowUp.answeredAt === ''
      ? pendingFollowUp.prompt
      : null

  return (
    <div
      data-testid="interview-session"
      className="relative flex h-dvh w-full flex-col overflow-hidden bg-background"
    >
      <EndInterviewButton sessionId={sessionId} />

      <div className="flex flex-1 items-center justify-center overflow-y-auto px-6 py-10">
        <InterviewTimeline
          topicLabel={session.topicLabel}
          questionNumber={questionNumber}
          totalQuestions={session.numQuestions}
          question={pendingTurn?.question ?? ''}
          followUpQuestion={followUpQuestion}
        />
      </div>

      <div className="shrink-0 border-t border-border bg-surface px-4 py-6">
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-3">
          {error ? (
            <div className="w-full rounded-lg border border-danger-subtle bg-danger-subtle p-3 text-sm text-danger-subtle-foreground">
              {error}
              <button
                type="button"
                onClick={clearError}
                className="ml-2 underline"
              >
                Dismiss
              </button>
            </div>
          ) : null}

          <AnswerRecorder
            sessionId={sessionId}
            isSubmitting={isSubmitting}
            isSpeaking={isSpeaking}
            onStopSpeaking={stopSpeaking}
            onSubmit={submitAnswer}
          />
        </div>
      </div>
    </div>
  )
}
