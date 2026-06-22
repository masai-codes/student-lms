'use client'

import { CheckCircle } from '@phosphor-icons/react'

import { ProblemSolutionForm } from './ProblemSolutionForm'
import type { ProblemDetailPayload } from '@/server/learn/utils/buildProblemDetailPayload'
import { MarkdownContent } from '@/components/shared/markdown-content'

type ProblemDetailPageProps = {
  detail: ProblemDetailPayload
}

function SubmittedSummary({ detail }: ProblemDetailPageProps) {
  const link = detail.solution?.submissionLink
  if (link == null) return null

  return (
    <div
      className="flex flex-col gap-1 rounded-lg bg-[#EDEBFE] p-3"
      data-testid="problem-submitted-summary"
    >
      <span className="flex items-center gap-2 type-b3-md text-gray-900">
        <CheckCircle className="size-5 text-[#6962AC]" weight="fill" aria-hidden />
        {detail.type === 'FILE' ? 'Submitted file' : 'Submitted link'}
        {detail.solution?.submittedAtLabel
          ? ` on ${detail.solution.submittedAtLabel}`
          : ''}
      </span>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="type-b3-md break-all text-blue-600 underline"
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
        <p className="type-t1 text-gray-600">{detail.assignmentTitle}</p>
        <h1 className="type-h4 text-gray-900">{detail.problemTitle}</h1>
      </header>

      <section data-testid="problem-statement">
        <h2 className="type-h6 text-gray-900">Instructions</h2>
        <MarkdownContent value={detail.statement} variant="detail" className="mt-3" />
      </section>

      <SubmittedSummary detail={detail} />

      {detail.canSubmit ? <ProblemSolutionForm detail={detail} /> : null}
    </div>
  )
}
