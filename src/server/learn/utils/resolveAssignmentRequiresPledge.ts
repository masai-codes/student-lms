import type { AssignmentKind } from '@/server/learn/assignmentDetailTypes'

export type ResolveAssignmentRequiresPledgeInput = {
  assignmentKind: AssignmentKind
  schedule: string | null
  nowMs: number
  hasSubmission: boolean
}

function isUnlocked(schedule: string | null, nowMs: number): boolean {
  if (schedule == null || schedule.trim() === '') return true
  const scheduleMs = new Date(schedule).getTime()
  if (!Number.isFinite(scheduleMs)) return true
  return nowMs >= scheduleMs
}

/**
 * Evaluation assignments require an integrity pledge before the learner's
 * submission row is created. Mirrors the legacy gate: evaluation kind, the
 * window has opened, and no submission exists yet.
 */
export function resolveAssignmentRequiresPledge(
  input: ResolveAssignmentRequiresPledgeInput,
): boolean {
  return (
    input.assignmentKind === 'evaluation' &&
    !input.hasSubmission &&
    isUnlocked(input.schedule, input.nowMs)
  )
}
