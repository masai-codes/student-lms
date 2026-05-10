import { createServerFn } from '@tanstack/react-start'

import type { LearnHubDetailPayload } from '@/server/learn/types'

import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'
import { getAssignmentLearningDetailForUser } from '@/server/learn/services/getAssignmentLearningDetail.service'

export const getAssignmentLearningDetail = createServerFn({ method: 'GET' })
  .inputValidator((data: { assignmentId: number }) => data)
  .handler(async ({ data }): Promise<LearnHubDetailPayload> => {
    const userId = await getCurrentSessionUserId()
    if (!userId) {
      throw new Error('UNAUTHORIZED')
    }
    return getAssignmentLearningDetailForUser(userId, data.assignmentId)
  })
