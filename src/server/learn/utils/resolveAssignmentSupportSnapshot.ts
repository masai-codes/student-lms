import type { AssignmentKind, AssignmentPhase } from '@/server/learn/assignmentDetailTypes'
import type { AssignmentDetailFooter } from '@/server/learn/assignmentDetailFooterTypes'
import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'

export type AssignmentSupportSnapshotTone = 'neutral' | 'success' | 'warning' | 'danger'

export type ResolvedAssignmentSupportSnapshot = {
  assignmentId: number
  assignmentKind: AssignmentKind
  phase: AssignmentPhase
  progressStatus: AssignmentProgressStatus
  typeLabel: string | null
  statusLabel: string
  statusTone: AssignmentSupportSnapshotTone
  scoreDisplay: string | null
  scorePolicyNotice: string | null
}

const ASSIGNMENT_STATUS: Record<
  AssignmentProgressStatus,
  { label: string; tone: AssignmentSupportSnapshotTone }
> = {
  new: { label: 'Not started', tone: 'neutral' },
  'in-progress': { label: 'In progress', tone: 'warning' },
  completed: { label: 'Submitted', tone: 'success' },
  overdue: { label: 'Overdue', tone: 'danger' },
}

function resolveTypeLabel(assignmentKind: AssignmentKind): string | null {
  if (assignmentKind === 'practice') return 'Practice'
  if (assignmentKind === 'assignment') return 'Graded'
  return null
}

function resolveEvaluationAttemptStatus(
  progressStatus: AssignmentProgressStatus,
): { label: string; tone: AssignmentSupportSnapshotTone } {
  if (progressStatus === 'completed' || progressStatus === 'in-progress') {
    return { label: 'Attempted', tone: 'success' }
  }
  return { label: 'Not Attempted', tone: 'neutral' }
}

function resolveScoreDisplay(footer: AssignmentDetailFooter): string | null {
  const score = footer.score
  if (score == null) return '-'

  if (score.state === 'pending') return 'Pending'

  if (score.state === 'released' && score.score != null) {
    return `${score.score.toFixed(2)}/10`
  }

  return '-'
}

function resolveScorePolicyNotice(assignmentKind: AssignmentKind): string | null {
  const policyNotice = (message: string) => message

  if (assignmentKind === 'practice') {
    return policyNotice('Score will not be considered for final grading')
  }

  if (assignmentKind === 'assignment' || assignmentKind === 'evaluation') {
    return policyNotice('Score will be considered for final grading')
  }

  return null
}

export function resolveAssignmentSupportSnapshot(input: {
  assignmentId: number
  assignmentKind: AssignmentKind
  phase: AssignmentPhase
  progressStatus: AssignmentProgressStatus
  footer: AssignmentDetailFooter
}): ResolvedAssignmentSupportSnapshot {
  const typeLabel = resolveTypeLabel(input.assignmentKind)

  const status =
    input.assignmentKind === 'evaluation'
      ? resolveEvaluationAttemptStatus(input.progressStatus)
      : ASSIGNMENT_STATUS[input.progressStatus]

  const scoreDisplay =
    input.assignmentKind === 'evaluation'
      ? resolveScoreDisplay(input.footer)
      : null

  const scorePolicyNotice = resolveScorePolicyNotice(input.assignmentKind)

  return {
    assignmentId: input.assignmentId,
    assignmentKind: input.assignmentKind,
    phase: input.phase,
    progressStatus: input.progressStatus,
    typeLabel,
    statusLabel: status.label,
    statusTone: status.tone,
    scoreDisplay,
    scorePolicyNotice,
  }
}
