import type {
  AssignmentKind,
  AssignmentPhase,
} from '@/server/learn/assignmentDetailTypes'
import type { AssignmentDetailFooter } from '@/server/learn/assignmentDetailFooterTypes'
import { readWeightagePercentage } from '@/server/learn/utils/buildAssignmentHeaderBadges'
import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'

type AssignmentSupportSnapshotTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'

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
  /** From `settings.weightagePercentage` when set; drives the weightage card + policy banner. */
  weightagePercentage: number | null
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

/** Practice assignments past deadline stay in practice mode — not "Overdue". */
function resolvePracticeAssignmentStatus(
  progressStatus: AssignmentProgressStatus,
): { label: string; tone: AssignmentSupportSnapshotTone } {
  if (progressStatus === 'overdue') {
    return { label: 'Practice Mode', tone: 'neutral' }
  }
  return ASSIGNMENT_STATUS[progressStatus]
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

function resolveScorePolicyNotice(
  settings: Record<string, unknown> | null,
): string | null {
  if (readWeightagePercentage(settings) == null) return null
  return 'Score will be considered for final grading'
}

export function resolveAssignmentSupportSnapshot(input: {
  assignmentId: number
  assignmentKind: AssignmentKind
  phase: AssignmentPhase
  progressStatus: AssignmentProgressStatus
  settings: Record<string, unknown> | null
  footer: AssignmentDetailFooter
}): ResolvedAssignmentSupportSnapshot {
  const typeLabel = resolveTypeLabel(input.assignmentKind)

  const status =
    input.assignmentKind === 'evaluation'
      ? resolveEvaluationAttemptStatus(input.progressStatus)
      : input.assignmentKind === 'practice'
        ? resolvePracticeAssignmentStatus(input.progressStatus)
        : ASSIGNMENT_STATUS[input.progressStatus]

  const scoreDisplay =
    input.assignmentKind === 'evaluation'
      ? resolveScoreDisplay(input.footer)
      : null

  const scorePolicyNotice = resolveScorePolicyNotice(input.settings)
  const weightagePercentage = readWeightagePercentage(input.settings)

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
    weightagePercentage,
  }
}
