import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'

import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'
import { getResourceLearningDetailForUser } from '@/server/learn/services/getResourceLearningDetail.service'

/** @deprecated Use GET `/api/learn/resources/:resourceId` via `fetchResourceLearningDetailFromApi`. */
export async function getResourceLearningDetailHandler(
  resourceId: number,
): Promise<ResourceDetailPayload> {
  const userId = await getCurrentSessionUserId()
  if (!userId) {
    throw new Error('UNAUTHORIZED')
  }
  return getResourceLearningDetailForUser(userId, resourceId)
}
