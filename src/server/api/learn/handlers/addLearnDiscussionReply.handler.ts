import { z } from 'zod'

import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { addReplyToLearnDiscussion } from '@/server/new-discussions/services/addReplyToLearnDiscussion'

const bodySchema = z.object({ message: z.string() })

export async function handleAddLearnDiscussionReply(
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
      throw new ApiError(400, 'INVALID_REPLY_MESSAGE')
    }

    await addReplyToLearnDiscussion({
      authorUserId: userId,
      discussionId,
      rawMessage: parsed.data.message,
    })

    return jsonOk({ ok: true })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
