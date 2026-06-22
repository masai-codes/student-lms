import { formatSqlDate } from '@/utils/generics'

/**
 * "Completed on …" banner shown on the assignment detail page.
 * - `auto-graded`: submission auto-completed (graded), timestamp clamped to `concludes`.
 * - `manual`: learner marked it complete (`data.marked_completed_at`).
 */
export type AssignmentCompletedDetails = {
  variant: 'auto-graded' | 'manual'
  completedAtLabel: string
  message: string
}

export type AssignmentCompletedDetailsInput = {
  submission: {
    completed: boolean
    completedAt: string | null
    data: Record<string, unknown> | null
  } | null
  concludes: string | null
}

function toTimestamp(value: string | null): number | null {
  if (value == null || value.trim() === '') return null
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) ? ms : null
}

/** Clamp the completion timestamp so it never displays later than the deadline. */
function clampCompletedAt(completedAt: string, concludes: string | null): string {
  const concludesMs = toTimestamp(concludes)
  const completedMs = toTimestamp(completedAt)
  if (concludesMs != null && completedMs != null && completedMs > concludesMs) {
    return concludes as string
  }
  return completedAt
}

function readMarkedCompletedAt(data: Record<string, unknown> | null): string | null {
  const value = data?.['marked_completed_at']
  return typeof value === 'string' && value.trim() !== '' ? value : null
}

export function buildAssignmentCompletedDetails(
  input: AssignmentCompletedDetailsInput,
): AssignmentCompletedDetails | null {
  const { submission, concludes } = input
  if (submission == null) return null

  if (submission.completed && submission.completedAt != null) {
    const completedAtLabel = formatSqlDate(
      clampCompletedAt(submission.completedAt, concludes),
    )
    return {
      variant: 'auto-graded',
      completedAtLabel,
      message: `This assignment was automatically marked as "Completed" on ${completedAtLabel} and graded.`,
    }
  }

  const markedCompletedAt = readMarkedCompletedAt(submission.data)
  if (markedCompletedAt != null) {
    const completedAtLabel = formatSqlDate(markedCompletedAt)
    return {
      variant: 'manual',
      completedAtLabel,
      message: `You have marked this assignment as "Completed" on ${completedAtLabel}.`,
    }
  }

  return null
}
