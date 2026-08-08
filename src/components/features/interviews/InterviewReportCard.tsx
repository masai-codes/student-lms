import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Progress } from '@/components/ui/progress'
import type {
  InterviewReport,
  InterviewTurn,
} from '@/server/api/interviews/types/interviewSession'

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

function ExchangeCard({
  label,
  prompt,
  transcript,
  answerAudioBase64,
}: {
  label: string
  prompt: string
  transcript: string
  answerAudioBase64: string | null
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-foreground-muted">
        {label}
      </p>
      <p className="mb-2 text-sm font-medium text-foreground">{prompt}</p>
      {answerAudioBase64 ? (
        <audio
          controls
          src={`data:audio/wav;base64,${answerAudioBase64}`}
          className="h-9 max-w-full"
        />
      ) : (
        <p className="text-sm text-foreground-muted">{transcript}</p>
      )}
    </div>
  )
}

function ReviewQuestionsPanel({ turns }: { turns: Array<InterviewTurn> }) {
  return (
    <div
      data-testid="interview-review-questions"
      className="mb-6 flex flex-col gap-4"
    >
      {turns.map((turn) => (
        <div key={turn.questionIndex} className="flex flex-col gap-3">
          <ExchangeCard
            label={`Question ${turn.questionIndex + 1}`}
            prompt={turn.question}
            transcript={turn.transcript}
            answerAudioBase64={turn.answerAudioBase64}
          />
          {turn.followUps.map((followUp, i) => (
            <ExchangeCard
              key={i}
              label={`Question ${turn.questionIndex + 1} · Follow-up`}
              prompt={followUp.prompt}
              transcript={followUp.transcript}
              answerAudioBase64={followUp.answerAudioBase64}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function InterviewReportCard({
  topicLabel,
  report,
  turns,
}: {
  topicLabel: string
  report: InterviewReport
  turns: Array<InterviewTurn>
}) {
  const navigate = useNavigate()
  const [showReview, setShowReview] = useState(false)

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

      {showReview ? <ReviewQuestionsPanel turns={turns} /> : null}

      <div className="flex gap-3">
        <button
          type="button"
          data-testid="interview-review-questions-toggle"
          onClick={() => setShowReview((v) => !v)}
          className="rounded-lg border border-border px-5 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-surface-muted"
        >
          {showReview ? 'Hide questions' : 'Review questions'}
        </button>
        <button
          type="button"
          onClick={() => void navigate({ to: '/interviews' })}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground transition-opacity hover:opacity-90"
        >
          Practice again
        </button>
      </div>
    </div>
  )
}
