import type {
  ProblemDetailRow,
  ProblemSolutionRow,
} from '@/server/learn/queries/fetchProblemDetail'
import { formatSqlDate } from '@/utils/generics'

type ProblemSubmissionType = 'LINK' | 'FILE' | 'BUTTON'

type ProblemSolutionState = {
  id: number
  submissionLink: string | null
  submittedAtLabel: string | null
}

export type ProblemDetailPayload = {
  assignmentId: number
  problemId: number
  elementId: number
  assignmentTitle: string
  problemTitle: string
  statement: string
  type: ProblemSubmissionType
  /** LINK/FILE problems accept a submission; BUTTON problems do not. */
  acceptsSubmission: boolean
  allowMultipleSubmissions: boolean
  /** Whether the submission input should be shown right now. */
  canSubmit: boolean
  solution: ProblemSolutionState | null
}

export type BuildProblemDetailPayloadInput = {
  assignmentId: number
  assignmentTitle: string
  settings: Record<string, unknown> | null
  problem: ProblemDetailRow
  solution: ProblemSolutionRow | null
}

function normalizeProblemType(type: string): ProblemSubmissionType {
  const normalized = type.trim().toUpperCase()
  if (normalized === 'LINK' || normalized === 'FILE') {
    return normalized
  }
  return 'BUTTON'
}

function toSolutionState(
  solution: ProblemSolutionRow | null,
): ProblemSolutionState | null {
  if (solution == null) return null
  const submissionLink =
    solution.submissionLink != null && solution.submissionLink.trim() !== ''
      ? solution.submissionLink
      : null
  return {
    id: solution.id,
    submissionLink,
    submittedAtLabel:
      submissionLink != null && solution.submittedAt != null
        ? formatSqlDate(solution.submittedAt)
        : null,
  }
}

export function buildProblemDetailPayload(
  input: BuildProblemDetailPayloadInput,
): ProblemDetailPayload {
  const type = normalizeProblemType(input.problem.type)
  const acceptsSubmission = type === 'LINK' || type === 'FILE'
  const allowMultipleSubmissions =
    input.settings?.['is_multiple_submissions_allowed'] === true
  const solution = toSolutionState(input.solution)

  const canSubmit =
    acceptsSubmission &&
    solution != null &&
    (solution.submissionLink == null || allowMultipleSubmissions)

  return {
    assignmentId: input.assignmentId,
    problemId: input.problem.problemId,
    elementId: input.problem.elementId,
    assignmentTitle: input.assignmentTitle,
    problemTitle: input.problem.title,
    statement: input.problem.statement,
    type,
    acceptsSubmission,
    allowMultipleSubmissions,
    canSubmit,
    solution,
  }
}
