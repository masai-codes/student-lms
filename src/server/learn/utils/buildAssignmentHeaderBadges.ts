import type { AssignmentKind } from '@/server/learn/assignmentDetailTypes'
import {
  formatAssignmentWeightageLabel,
  resolveAssignmentWeightage,
} from '@/server/learn/utils/resolveAssignmentWeightage'

/** Distinct header badges shown next to the assignment meta row. */
export type AssignmentHeaderBadge = {
  kind: 'deadline-enforced' | 'weightage'
  label: string
}

export type AssignmentHeaderBadgesInput = {
  assignmentKind: AssignmentKind
  enforceDeadline: boolean
  settings: Record<string, unknown> | null
}

export function buildAssignmentHeaderBadges(
  input: AssignmentHeaderBadgesInput,
): Array<AssignmentHeaderBadge> {
  const badges: Array<AssignmentHeaderBadge> = []

  if (input.enforceDeadline) {
    badges.push({ kind: 'deadline-enforced', label: 'Deadline Enforced' })
  }

  // Weightage shows for any assignment type that has one configured — it is set
  // per assignment in the old LMS, not implied by the type.
  const weightage = resolveAssignmentWeightage(input.settings)
  if (weightage != null) {
    badges.push({
      kind: 'weightage',
      label: formatAssignmentWeightageLabel(weightage),
    })
  }

  return badges
}
