import { createServerFn } from '@tanstack/react-start'

import type { ResourceDetailPayload } from '@/server/learn/resourceDetailTypes'

import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'
import { getResourceLearningDetailForUser } from '@/server/learn/services/getResourceLearningDetail.service'

export const getResourceLearningDetail = createServerFn({ method: 'GET' })
  .inputValidator((data: { resourceId: number }) => data)
  .handler(async ({ data }): Promise<ResourceDetailPayload> => {
    const userId = await getCurrentSessionUserId()
    if (!userId) {
      throw new Error('UNAUTHORIZED')
    }
    return getResourceLearningDetailForUser(userId, data.resourceId)
  })
