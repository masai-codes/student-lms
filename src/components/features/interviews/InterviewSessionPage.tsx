import { useInterviewSession } from '@/hooks/useInterviewSession'
import { INTERVIEW_TOTAL_QUESTIONS } from '@/lib/interviews/interviewConstants'
import { AnswerRecorder } from './AnswerRecorder'
import { InterviewQuestion } from './InterviewQuestion'
import { InterviewReportCard } from './InterviewReportCard'

function InterviewSessionSkeleton() {
  return (
    <div className="mx-auto w-full max-w-2xl py-8">
      <div className="mb-4 h-4 w-40 animate-pulse rounded bg-surface-muted" />
      <div className="mb-6 h-8 w-full animate-pulse rounded bg-surface-muted" />
      <div className="h-10 w-64 animate-pulse rounded bg-surface-muted" />
    </div>
  )
}

export function InterviewSessionPage({ sessionId }: { sessionId: number }) {
  const {
    session,
    isLoading,
    isError,
    isSubmitting,
    error,
    submitAnswer,
    clearError,
  } = useInterviewSession(sessionId)

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
      />
    )
  }

  const answeredTurns = session.turns.filter((turn) => turn.transcript !== '')
  const pendingTurn =
    session.turns.find((turn) => turn.transcript === '') ?? session.turns.at(-1)
  const questionNumber = (pendingTurn?.index ?? 0) + 1

  return (
    <div className="mx-auto w-full max-w-2xl py-8">
      <InterviewQuestion
        topicLabel={session.topicLabel}
        questionNumber={questionNumber}
        totalQuestions={INTERVIEW_TOTAL_QUESTIONS}
        question={pendingTurn?.question ?? ''}
        answeredTurns={answeredTurns}
      />

      {error ? (
        <div className="mb-4 rounded-lg border border-danger-subtle bg-danger-subtle p-3 text-sm text-danger-subtle-foreground">
          {error}
          <button type="button" onClick={clearError} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      ) : null}

      <AnswerRecorder isSubmitting={isSubmitting} onSubmit={submitAnswer} />
    </div>
  )
}
