import type { AssignmentKind } from '@/server/learn/assignmentDetailTypes'

export type AssignmentFooterActionLabels = {
  start: string
  continue: string
}

const LABELS: Record<AssignmentKind, AssignmentFooterActionLabels> = {
  practice: {
    start: 'Start practice',
    continue: 'Continue practice',
  },
  assignment: {
    start: 'Start Assignment',
    continue: 'Continue Assignment',
  },
  evaluation: {
    start: 'Start Evaluation',
    continue: 'Continue Evaluation',
  },
}

export function getAssignmentFooterActionLabels(
  kind: AssignmentKind,
): AssignmentFooterActionLabels {
  return LABELS[kind]
}
