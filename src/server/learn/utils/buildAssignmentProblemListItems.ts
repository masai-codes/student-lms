import type { AssignmentProblemRow } from '@/server/learn/queries/fetchAssignmentProblems'

export type AssignmentProblemStatusTone =
  'completed' | 'in-progress' | 'pending'

export type AssignmentProblemStatusChip = {
  tone: AssignmentProblemStatusTone
  label: string
}

export type AssignmentProblemListItem = {
  elementId: number
  problemId: number
  title: string
  statusChip: AssignmentProblemStatusChip | null
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

/** Maps a raw `solutions.status` to a display chip (null when there is no status yet). */
export function resolveProblemStatusChip(
  status: string | null | undefined,
): AssignmentProblemStatusChip | null {
  const normalized = status?.trim().toLowerCase()
  if (normalized == null || normalized === '') return null
  if (normalized === 'submitted') {
    return { tone: 'completed', label: 'Completed' }
  }
  if (normalized === 'in-progress') {
    return { tone: 'in-progress', label: 'In Progress' }
  }
  return { tone: 'pending', label: capitalize(normalized) }
}

export function buildAssignmentProblemListItems(
  rows: Array<AssignmentProblemRow>,
  solutionStatusByProblemId: Map<number, string | null>,
): Array<AssignmentProblemListItem> {
  return rows.map((row) => ({
    elementId: row.elementId,
    problemId: row.problemId,
    title: row.title,
    statusChip: resolveProblemStatusChip(
      solutionStatusByProblemId.get(row.problemId),
    ),
  }))
}
