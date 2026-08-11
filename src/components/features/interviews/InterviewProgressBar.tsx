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
      className="flex w-full max-w-[30rem] gap-2"
    >
      {Array.from({ length: totalQuestions }, (_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-colors ${
            i < questionNumber - 1
              ? 'bg-brand'
              : i === questionNumber - 1
                ? 'bg-brand/50'
                : 'bg-border'
          }`}
        />
      ))}
    </div>
  )
}
