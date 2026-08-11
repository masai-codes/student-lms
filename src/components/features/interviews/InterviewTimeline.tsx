import { InterviewProgressBar } from './InterviewProgressBar'

/**
 * Single-question focus view — deliberately shows ONLY the current planned
 * question (plus a live follow-up, if the interviewer asked one) and nothing
 * from earlier questions. Full history is only ever shown after the
 * interview ends, via the report's "Review questions" screen.
 */
export function InterviewTimeline({
  topicLabel,
  questionNumber,
  totalQuestions,
  question,
  followUpQuestion,
}: {
  topicLabel: string
  questionNumber: number
  totalQuestions: number
  question: string
  /** The interviewer's current follow-up on this question, if any — shown as
   * a sub-line below the main question. */
  followUpQuestion?: string | null
}) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <InterviewProgressBar
        questionNumber={questionNumber}
        totalQuestions={totalQuestions}
      />
      <p className="text-sm font-medium text-foreground-muted">
        {topicLabel} · Question {questionNumber} of {totalQuestions}
      </p>

      <div
        data-testid="interview-question"
        className="flex max-w-2xl flex-col items-center gap-4"
      >
        <span className="flex size-11 items-center justify-center rounded-xl bg-brand text-sm font-semibold text-brand-foreground">
          Q{questionNumber}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {question}
        </h1>

        {followUpQuestion ? (
          <p
            data-testid="interview-follow-up"
            className="text-base text-foreground-muted"
          >
            {followUpQuestion}
          </p>
        ) : null}
      </div>
    </div>
  )
}
