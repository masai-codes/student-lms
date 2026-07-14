'use client'

import { CheckCircle } from '@phosphor-icons/react'

import { ProblemSolutionForm } from './ProblemSolutionForm'
import type { ProblemDetailPayload } from '@/server/learn/utils/buildProblemDetailPayload'
import { MarkdownContent } from '@/components/shared/markdown-content'
import {
  learnEntityEvent,
  pushLearnEvent,
} from '@/components/features/learn/shared/learnAnalytics'

type ProblemDetailPageProps = {
  detail: ProblemDetailPayload
}

function SubmittedSummary({ detail }: ProblemDetailPageProps) {
  const link = detail.solution?.submissionLink
  if (link == null) return null

  return (
    <div
      className="flex flex-col gap-1 rounded-lg bg-brand-subtle p-3"
      data-testid="problem-submitted-summary"
    >
      <span className="flex items-center gap-2 type-b3-md text-foreground">
        <CheckCircle className="size-5 text-brand" weight="fill" aria-hidden />
        {detail.type === 'FILE' ? 'Submitted file' : 'Submitted link'}
        {detail.solution?.submittedAtLabel
          ? ` on ${detail.solution.submittedAtLabel}`
          : ''}
      </span>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          pushLearnEvent(
            learnEntityEvent(
              'assignment',
              'problem_solution_view',
              detail.problemId,
            ),
            {
              assignment_id: detail.assignmentId,
              problem_id: detail.problemId,
              submission_id: detail.solution?.id,
            },
          )
        }
        className="type-b3-md break-all text-brand underline"
      >
        {link}
      </a>
    </div>
  )
}

export function ProblemDetailPage({ detail }: ProblemDetailPageProps) {
  return (
    <div className="w-full space-y-6 pb-12">
      <header className="space-y-1">
        <p className="type-t1 text-foreground-muted">
          {detail.assignmentTitle}
        </p>
        <h1 className="type-h4 text-foreground">{detail.problemTitle}</h1>
      </header>

      <section data-testid="problem-statement">
        <h2 className="type-h6 text-foreground">Instructions</h2>
        <MarkdownContent
          value={detail.statement}
          variant="detail"
          className="mt-3"
        />
      </section>

      <SubmittedSummary detail={detail} />

      {detail.canSubmit ? <ProblemSolutionForm detail={detail} /> : null}
    </div>
  )
}
