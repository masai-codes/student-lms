import { createServerFn } from '@tanstack/react-start'

import type { LearnHubDetailPayload } from '@/server/learn/types'

import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'
import { getResourceLearningDetailForUser } from '@/server/learn/services/getResourceLearningDetail.service'

export const getResourceLearningDetail = createServerFn({ method: 'GET' })
  .inputValidator((data: { resourceId: number }) => data)
  .handler(async ({ data }): Promise<LearnHubDetailPayload> => {
    const userId = await getCurrentSessionUserId()
    if (!userId) {
      throw new Error('UNAUTHORIZED')
    }
    return getResourceLearningDetailForUser(userId, data.resourceId)
  })
