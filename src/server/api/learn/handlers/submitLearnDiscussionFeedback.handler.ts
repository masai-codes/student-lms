import { z } from 'zod'

import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { submitLearnDiscussionFeedback } from '@/server/new-discussions/services/submitLearnDiscussionFeedback'

const bodySchema = z.object({
  rating: z.number(),
  comment: z.string().optional(),
})

export async function handleSubmitLearnDiscussionFeedback(
  request: Request,
  discussionIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const discussionId = parsePositiveIdParam(
      discussionIdParam,
      'INVALID_DISCUSSION_ID',
    )

    const rawBody = await request.json().catch(() => ({}))
    const parsed = bodySchema.safeParse(rawBody)
    if (!parsed.success) {
      throw new ApiError(400, 'INVALID_FEEDBACK_PAYLOAD')
    }

    const result = await submitLearnDiscussionFeedback({
      viewerUserId: userId,
      discussionId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    })

    return jsonOk(result)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
