export type AssignmentProgressStatus =
  | 'new'
  | 'in-progress'
  | 'overdue'
  | 'completed'

export type AssignmentSubmissionProgress = {
  completed: boolean
  status: string | null
  markAsCompleted: boolean | null
} | null

function toTimestamp(value: string | null): number | null {
  if (value == null || value.trim() === '') return null
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) ? ms : null
}

/** Mirrors legacy LMS assignment list status (`experience-api` `calculateAssignmentStatus`). */
export function calculateAssignmentProgressStatus(input: {
  schedule: string | null
  concludes: string | null
  nowMs: number
  submission: AssignmentSubmissionProgress
}): AssignmentProgressStatus {
  const startTime = toTimestamp(input.schedule) ?? 0
  const concludesTime = toTimestamp(input.concludes)
  const submission = input.submission

  if (startTime > 0 && input.nowMs < startTime) {
    return 'new'
  }

  if (
    concludesTime != null &&
    input.nowMs >= startTime &&
    input.nowMs < concludesTime &&
    submission == null
  ) {
    return 'new'
  }

  if (
    input.nowMs > startTime &&
    submission != null &&
    (submission.completed ||
      submission.status === 'submitted' ||
      submission.markAsCompleted === true)
  ) {
    return 'completed'
  }

  if (
    concludesTime != null &&
    input.nowMs >= startTime &&
    input.nowMs < concludesTime &&
    submission != null
  ) {
    return 'in-progress'
  }

  if (
    concludesTime != null &&
    input.nowMs > concludesTime &&
    (submission == null || submission.status === 'pending')
  ) {
    return 'overdue'
  }

  if (concludesTime == null) {
    if (
      submission != null &&
      (submission.completed ||
        submission.status === 'submitted' ||
        submission.markAsCompleted === true)
    ) {
      return 'completed'
    }
    if (submission != null) {
      return 'in-progress'
    }
    return 'new'
  }

  return 'new'
}
