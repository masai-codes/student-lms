import type { AssignmentDetailPayload } from '@/server/learn/assignmentDetailTypes'

import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'
import { getAssignmentLearningDetailForUser } from '@/server/learn/services/getAssignmentLearningDetail.service'

/** @deprecated Use GET `/api/learn/assignments/:assignmentId` via `fetchAssignmentLearningDetailFromApi`. */
export async function getAssignmentLearningDetailHandler(
  assignmentId: number,
): Promise<AssignmentDetailPayload> {
  const userId = await getCurrentSessionUserId()
  if (!userId) {
    throw new Error('UNAUTHORIZED')
  }
  return getAssignmentLearningDetailForUser(userId, assignmentId)
}
