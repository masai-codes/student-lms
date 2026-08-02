import type { InterviewTurn } from '@/server/api/interviews/types/interviewSession'

export function InterviewQuestion({
  topicLabel,
  questionNumber,
  totalQuestions,
  question,
  answeredTurns,
}: {
  topicLabel: string
  questionNumber: number
  totalQuestions: number
  question: string
  answeredTurns: Array<InterviewTurn>
}) {
  return (
    <div className="mb-6">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground-muted">
        {topicLabel} · Question {questionNumber} of {totalQuestions}
      </p>
      <h1
        data-testid="interview-question"
        className="type-h5 font-semibold text-foreground"
      >
        {question}
      </h1>

      {answeredTurns.length > 0 ? (
        <div className="mt-6 flex flex-col gap-3">
          {answeredTurns.map((turn) => (
            <div
              key={turn.index}
              className="rounded-lg border border-border bg-surface-muted p-3"
            >
              <p className="text-sm font-medium text-foreground-muted">
                {turn.question}
              </p>
              <p className="mt-1 text-sm text-foreground">{turn.transcript}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
