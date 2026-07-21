import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'

import { getCurrentUserId } from '@/server/auth/getCurrentSessionUserId'
import { getResourceLearningDetailForUser } from '@/server/learn/services/getResourceLearningDetail.service'

/** @deprecated Use GET `/api/learn/resources/:resourceId` via `fetchResourceLearningDetailFromApi`. */
export async function getResourceLearningDetailHandler(
  resourceId: number,
): Promise<ResourceDetailPayload> {
  const userId = await getCurrentUserId()
  if (!userId) {
    throw new Error('UNAUTHORIZED')
  }
  return getResourceLearningDetailForUser(userId, resourceId)
}
