'use client'

import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'

import type { ProblemDetailPayload } from '@/server/learn/utils/buildProblemDetailPayload'
import {
  submitSolutionLink,
  uploadSolutionFile,
} from '@/lib/api/learn/assignmentDetailActionsApi'
import { isValidSubmissionUrl } from '@/lib/learn/isValidSubmissionUrl'
import { MasaiButton } from '@/components/ui/masai-button'
import { MasaiInput } from '@/components/ui/masai-input'
import {
  learnEntityEvent,
  pushLearnEvent,
} from '@/components/features/learn/shared/learnAnalytics'

type ProblemSolutionFormProps = {
  detail: ProblemDetailPayload
}

/** Submission form for LINK (URL) and FILE (upload) problems. */
export function ProblemSolutionForm({ detail }: ProblemSolutionFormProps) {
  const router = useRouter()
  const solutionId = detail.solution?.id ?? null
  const [link, setLink] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (solutionId == null) {
    return null
  }

  const runSubmit = async (submit: () => Promise<unknown>) => {
    setLoading(true)
    setErrorMessage(null)
    try {
      await submit()
      await router.invalidate()
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Could not submit your solution',
      )
      setLoading(false)
    }
  }

  const handleLinkSubmit = () => {
    if (!isValidSubmissionUrl(link)) {
      setErrorMessage('Please enter a valid link.')
      return
    }
    pushLearnEvent(
      learnEntityEvent(
        'assignment',
        'problem_solution_submit_link',
        detail.problemId,
      ),
      {
        problem_id: detail.problemId,
        assignment_id: detail.assignmentId,
        solution_id: solutionId,
      },
    )
    void runSubmit(() => submitSolutionLink(solutionId, link.trim()))
  }

  const handleFileSubmit = () => {
    if (file == null) {
      setErrorMessage('Please choose a file to upload.')
      return
    }
    pushLearnEvent(
      learnEntityEvent(
        'assignment',
        'problem_solution_submit_file',
        detail.problemId,
      ),
      {
        problem_id: detail.problemId,
        assignment_id: detail.assignmentId,
        solution_id: solutionId,
      },
    )
    void runSubmit(() => uploadSolutionFile(solutionId, file))
  }

  return (
    <section data-testid="problem-solution-form" className="space-y-3">
      <h2 className="type-h6 text-foreground">Submission</h2>
      {errorMessage ? (
        <p className="type-b3-md text-danger" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {detail.type === 'LINK' ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <MasaiInput
            type="text"
            placeholder="Submission link"
            value={link}
            disabled={loading}
            onChange={(event) => {
              setErrorMessage(null)
              setLink(event.target.value)
            }}
            className="flex-1"
            data-testid="problem-solution-link-input"
          />
          <MasaiButton
            type="primary"
            size="md"
            ctaText="Submit"
            htmlType="button"
            disabled={loading || link.trim() === ''}
            onClick={handleLinkSubmit}
            data-testid="problem-solution-link-submit"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="file"
            disabled={loading}
            onChange={(event) => {
              setErrorMessage(null)
              setFile(event.target.files?.[0] ?? null)
            }}
            className="type-b3-md text-foreground"
            data-testid="problem-solution-file-input"
          />
          <MasaiButton
            type="primary"
            size="md"
            ctaText="Submit"
            htmlType="button"
            disabled={loading || file == null}
            onClick={handleFileSubmit}
            data-testid="problem-solution-file-submit"
          />
        </div>
      )}
    </section>
  )
}
