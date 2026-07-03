import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import {
  setPostBanned,
  setReplyBanned,
} from '@/server/api/masaiverse-v2/services/moderateDiscussion.service'

/**
 * Bans/unbans a post or a reply (admin only). Body:
 *  - `{ target: 'post', postId, banned }`
 *  - `{ target: 'reply', postId, replyId, banned }`
 */
export async function handleModerateDiscussion(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request.json().catch(() => null)) as {
      target?: unknown
      postId?: unknown
      replyId?: unknown
      banned?: unknown
    } | null

    const target = body?.target
    const banned = body?.banned === true
    const postId = Number(body?.postId)

    if (target === 'post') {
      const result = await setPostBanned(userId, postId, banned)
      return jsonOk(result)
    }
    if (target === 'reply') {
      const replyId = Number(body?.replyId)
      const result = await setReplyBanned(userId, postId, replyId, banned)
      return jsonOk(result)
    }

    throw new ApiError(400, 'INVALID_MODERATION_TARGET')
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to moderate discussion', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_MODERATING'))
    }
    return mapThrownErrorToResponse(error)
  }
}
