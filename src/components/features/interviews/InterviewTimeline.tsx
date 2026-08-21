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
    <div className="flex w-full max-w-2xl items-stretch gap-5">
      {/* The speaker rail — a quiet, structural echo of how a real interview
          transcript marks whose turn it is. It's brand-colored while the
          interviewer holds the floor and hands off to a neutral tone once
          the candidate is answering (see the matching "You" label in
          AnswerRecorder). */}
      <div
        aria-hidden
        className="hidden shrink-0 flex-col items-center gap-2 pt-1.5 sm:flex"
      >
        <span className="size-2 rounded-full bg-brand" />
        <span className="w-px flex-1 bg-border" />
      </div>

      <div className="flex flex-1 flex-col items-start gap-5 text-left">
        <span className="type-b3-md text-foreground-subtle uppercase tracking-wider">
          Interviewer
        </span>

        <InterviewProgressBar
          questionNumber={questionNumber}
          totalQuestions={totalQuestions}
        />
        <p className="type-b2-regular -mt-2 text-foreground-muted">
          {topicLabel} · Question {questionNumber} of {totalQuestions}
        </p>

        <div
          key={questionNumber}
          data-testid="interview-question"
          className="animate-in fade-in slide-in-from-bottom-1 flex flex-col items-start gap-3 duration-300"
        >
          <span className="type-b3-md w-fit rounded-md bg-brand-subtle px-2 py-0.5 text-brand-subtle-foreground">
            Q{questionNumber}
          </span>
          <h1 className="type-h3 text-foreground sm:text-3xl">{question}</h1>

          {followUpQuestion ? (
            <p
              data-testid="interview-follow-up"
              className="type-b1-regular text-foreground-muted"
            >
              {followUpQuestion}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
