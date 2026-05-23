import type { AssignmentPhase } from '@/server/learn/assignmentDetailTypes'

function toTimestamp(value: string | null): number | null {
  if (value == null || value.trim() === '') return null
  const ms = new Date(value).getTime()
  return Number.isFinite(ms) ? ms : null
}

export function resolveAssignmentPhase(input: {
  schedule: string | null
  concludes: string | null
  nowMs: number
}): AssignmentPhase {
  const scheduleMs = toTimestamp(input.schedule)
  const concludesMs = toTimestamp(input.concludes)

  if (scheduleMs == null) {
    return 'during'
  }

  if (input.nowMs < scheduleMs) {
    return 'before'
  }

  if (concludesMs != null && input.nowMs > concludesMs) {
    return 'after'
  }

  return 'during'
}
