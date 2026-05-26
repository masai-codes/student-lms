import { createServerFn } from '@tanstack/react-start'

import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'
import { getLearnDiscussionById as getLearnDiscussionByIdService } from '@/server/new-discussions/services/getLearnDiscussionById'
import type { LearnDiscussionDetail } from '@/server/new-discussions/types/learnDiscussionDetail'

export const getLearnDiscussionById = createServerFn({ method: 'GET' })
  .inputValidator((data: { discussionId: number }) => data)
  .handler(async ({ data }): Promise<LearnDiscussionDetail> => {
    const userId = await getCurrentSessionUserId()
    if (!userId) {
      throw new Error('UNAUTHORIZED')
    }

    if (!Number.isFinite(data.discussionId) || data.discussionId <= 0) {
      throw new Error('INVALID_DISCUSSION_ID')
    }

    return getLearnDiscussionByIdService(userId, data.discussionId)
  })
