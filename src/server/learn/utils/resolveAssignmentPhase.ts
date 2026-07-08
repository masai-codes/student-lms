import type { AssignmentPhase } from '@/server/learn/assignmentDetailTypes'
import { parseIstToMs } from '@/server/time/istClock'

export function resolveAssignmentPhase(input: {
  schedule: string | null
  concludes: string | null
  nowMs: number
}): AssignmentPhase {
  const scheduleMs = parseIstToMs(input.schedule)
  const concludesMs = parseIstToMs(input.concludes)

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
