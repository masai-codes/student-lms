import { createServerFn } from '@tanstack/react-start'

import type { LearnHubDetailPayload } from '@/server/learn/types'

import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'
import { getLectureLearningDetailForUser } from '@/server/learn/services/getLectureLearningDetail.service'

export const getLectureLearningDetail = createServerFn({ method: 'GET' })
  .inputValidator((data: { lectureId: number }) => data)
  .handler(async ({ data }): Promise<LearnHubDetailPayload> => {
    const userId = await getCurrentSessionUserId()
    if (!userId) {
      throw new Error('UNAUTHORIZED')
    }
    return getLectureLearningDetailForUser(userId, data.lectureId)
  })
