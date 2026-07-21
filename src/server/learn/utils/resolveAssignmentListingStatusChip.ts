import type { AssignmentProgressStatus } from '@/server/learn/utils/calculateAssignmentProgressStatus'
import type { AssignmentListingStatusChip } from '@/server/learn/types'

/** Mirrors legacy `AssignmentListCard` status chip visibility on the all-assignments tab. */
export function resolveAssignmentListingStatusChip(
  status: AssignmentProgressStatus | null,
  assignmentType: string,
): AssignmentListingStatusChip {
  if (status == null || status === 'new') {
    return null
  }

  if (status === 'overdue' && assignmentType === 'evaluation') {
    return null
  }

  if (status === 'overdue' && assignmentType === 'practice') {
    return 'practice-mode'
  }

  return status
}
