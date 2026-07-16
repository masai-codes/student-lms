import type { AssignmentKind } from '@/server/learn/assignmentDetailTypes'

export type AssignmentNotStartedBannerCopy = {
  title: string
  description: string
}

const COPY: Record<AssignmentKind, AssignmentNotStartedBannerCopy> = {
  practice: {
    title: "Practice Assignment hasn't started yet",
    description: 'Practice Assignment will be unlocked and available at',
  },
  assignment: {
    title: "Assignment hasn't started yet",
    description: 'Assignment will be unlocked and available at',
  },
  evaluation: {
    title: "Evaluation hasn't started yet",
    description: 'Evaluation will be unlocked and available at',
  },
}

export function getAssignmentNotStartedBannerCopy(
  kind: AssignmentKind,
): AssignmentNotStartedBannerCopy {
  return COPY[kind]
}
