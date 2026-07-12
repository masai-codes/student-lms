import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { markLearnDiscussionRepliesRead } from '@/server/new-discussions/services/markLearnDiscussionRepliesRead'

export async function handleMarkLearnDiscussionRead(
  discussionIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const discussionId = parsePositiveIdParam(
      discussionIdParam,
      'INVALID_DISCUSSION_ID',
    )

    await markLearnDiscussionRepliesRead({
      viewerUserId: userId,
      discussionId,
    })

    return jsonOk({ ok: true })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
