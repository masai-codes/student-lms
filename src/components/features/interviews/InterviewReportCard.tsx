import { useNavigate } from '@tanstack/react-router'
import { Progress } from '@/components/ui/progress'
import type { InterviewReport } from '@/server/api/interviews/types/interviewSession'

function RubricRow({
  dimension,
  score,
  comment,
}: {
  dimension: string
  score: number
  comment: string
}) {
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{dimension}</span>
        <span className="text-foreground-muted">{score}/100</span>
      </div>
      <Progress value={score} />
      <p className="mt-1 text-xs text-foreground-muted">{comment}</p>
    </div>
  )
}

export function InterviewReportCard({
  topicLabel,
  report,
}: {
  topicLabel: string
  report: InterviewReport
}) {
  const navigate = useNavigate()

  return (
    <div
      data-testid="interview-report"
      className="mx-auto w-full max-w-2xl py-8"
    >
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground-muted">
        {topicLabel} · Interview complete
      </p>
      <div className="mb-6 flex items-baseline gap-2">
        <span className="type-h3 font-bold text-foreground">
          {report.overallScore}
        </span>
        <span className="text-sm text-foreground-muted">/ 100 overall</span>
      </div>

      <p className="mb-6 text-sm text-foreground">{report.summary}</p>

      <div className="mb-6 rounded-xl border border-border bg-surface p-4">
        <h2 className="type-b1-md mb-3 font-semibold text-foreground">
          Rubric
        </h2>
        {report.rubric.map((item) => (
          <RubricRow key={item.dimension} {...item} />
        ))}
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-success-subtle bg-success-subtle p-4">
          <h3 className="mb-2 text-sm font-semibold text-success-subtle-foreground">
            Strengths
          </h3>
          <ul className="list-disc space-y-1 pl-4 text-sm text-success-subtle-foreground">
            {report.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-warning-subtle bg-warning-subtle p-4">
          <h3 className="mb-2 text-sm font-semibold text-warning-subtle-foreground">
            Improvements
          </h3>
          <ul className="list-disc space-y-1 pl-4 text-sm text-warning-subtle-foreground">
            {report.improvements.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void navigate({ to: '/interviews' })}
        className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90"
      >
        Practice again
      </button>
    </div>
  )
}
