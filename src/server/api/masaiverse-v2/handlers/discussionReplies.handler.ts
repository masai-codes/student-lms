import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { createDiscussionReply } from '@/server/api/masaiverse-v2/services/createDiscussionReply.service'
import { getDiscussionReplies } from '@/server/api/masaiverse-v2/services/getDiscussionReplies.service'

export async function handleListDiscussionReplies(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const postId = Number(new URL(request.url).searchParams.get('postId'))
    const replies = await getDiscussionReplies(postId, userId)
    return jsonOk({ replies })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch replies', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_FETCHING_REPLIES'))
    }
    return mapThrownErrorToResponse(error)
  }
}

export async function handleCreateDiscussionReply(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const body = (await request.json().catch(() => null)) as {
      postId?: unknown
      content?: unknown
    } | null

    const postId = Number(body?.postId)
    const content = typeof body?.content === 'string' ? body.content : ''

    const created = await createDiscussionReply(userId, postId, content)
    return jsonOk(created, { status: 201 })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to create reply', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_CREATING_REPLY'))
    }
    return mapThrownErrorToResponse(error)
  }
}
