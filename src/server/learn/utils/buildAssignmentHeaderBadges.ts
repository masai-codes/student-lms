import type { AssignmentKind } from '@/server/learn/assignmentDetailTypes'

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

function readWeightagePercentage(
  settings: Record<string, unknown> | null,
): number | null {
  const raw = settings?.['weightagePercentage']
  const value =
    typeof raw === 'number'
      ? raw
      : typeof raw === 'string'
        ? Number(raw)
        : Number.NaN
  return Number.isFinite(value) && value > 0 ? value : null
}

export function buildAssignmentHeaderBadges(
  input: AssignmentHeaderBadgesInput,
): Array<AssignmentHeaderBadge> {
  const badges: Array<AssignmentHeaderBadge> = []

  if (input.enforceDeadline) {
    badges.push({ kind: 'deadline-enforced', label: 'Deadline Enforced' })
  }

  // Weightage only applies to graded evaluation assignments.
  if (input.assignmentKind === 'evaluation') {
    const weightage = readWeightagePercentage(input.settings)
    if (weightage != null) {
      badges.push({ kind: 'weightage', label: `${weightage}% Weightage` })
    }
  }

  return badges
}
