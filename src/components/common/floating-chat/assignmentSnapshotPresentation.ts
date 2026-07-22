import type {
  AssignmentSupportSnapshot,
  AssignmentSupportSnapshotTone,
} from '@/server/api/support/support.types'

const TONE_CLASS: Record<AssignmentSupportSnapshotTone, string> = {
  neutral: 'text-[#62647d]',
  success: 'text-[#0E9F6E]',
  warning: 'text-[#f59e0b]',
  danger: 'text-[#ef4444]',
}

export function getAssignmentSnapshotStatusClassName(
  tone: AssignmentSupportSnapshotTone,
): string {
  return TONE_CLASS[tone]
}

export function shouldShowAssignmentTypeCard(
  snapshot: AssignmentSupportSnapshot,
): boolean {
  return snapshot.typeLabel != null
}

export function shouldShowAssignmentScoreCard(
  snapshot: AssignmentSupportSnapshot,
): boolean {
  return snapshot.assignmentKind === 'evaluation'
}
