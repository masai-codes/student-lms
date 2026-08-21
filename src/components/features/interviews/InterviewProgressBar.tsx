/** Segmented "question N of total" progress bar — one segment per planned
 * question, filled up to (not including) the current question. Follow-ups
 * don't move this: it only advances when `questionNumber` itself changes. */
export function InterviewProgressBar({
  questionNumber,
  totalQuestions,
}: {
  questionNumber: number
  totalQuestions: number
}) {
  return (
    <div
      data-testid="interview-progress-bar"
      className="flex w-full max-w-[30rem] gap-1.5"
    >
      {Array.from({ length: totalQuestions }, (_, i) => {
        const isDone = i < questionNumber - 1
        const isCurrent = i === questionNumber - 1
        return (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
              isDone
                ? 'bg-brand'
                : isCurrent
                  ? 'animate-pulse bg-brand'
                  : 'bg-border'
            }`}
          />
        )
      })}
    </div>
  )
}
