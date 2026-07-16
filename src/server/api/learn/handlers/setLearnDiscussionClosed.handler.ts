import { z } from 'zod'

import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { setLearnDiscussionClosed } from '@/server/new-discussions/services/setLearnDiscussionClosed'

const bodySchema = z.object({ isClosed: z.boolean() })

export async function handleSetLearnDiscussionClosed(
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
      throw new ApiError(400, 'INVALID_DISCUSSION_PAYLOAD')
    }

    const result = await setLearnDiscussionClosed({
      viewerUserId: userId,
      discussionId,
      isClosed: parsed.data.isClosed,
    })

    return jsonOk(result)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
