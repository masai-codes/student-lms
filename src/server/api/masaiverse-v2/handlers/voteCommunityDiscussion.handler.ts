import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import {
  voteCommunityDiscussion,
  voteDiscussionReply,
} from '@/server/api/masaiverse-v2/services/voteCommunityDiscussion.service'

export async function handleVoteCommunityDiscussion(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request.json().catch(() => null)) as {
      postId?: unknown
      replyId?: unknown
      vote?: unknown
    } | null

    const vote = typeof body?.vote === 'string' ? body.vote : ''

    // A `replyId` in the body votes on a reply; otherwise it's a post vote.
    const state =
      body?.replyId != null
        ? await voteDiscussionReply(userId, Number(body.replyId), vote)
        : await voteCommunityDiscussion(userId, Number(body?.postId), vote)
    return jsonOk(state)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to vote on discussion', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_VOTING_DISCUSSION'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
