import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { createCommunityDiscussion } from '@/server/api/masaiverse-v2/services/createCommunityDiscussion.service'

export async function handleCreateCommunityDiscussion(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const body = (await request.json().catch(() => null)) as {
      title?: unknown
      content?: unknown
      tags?: unknown
      clubId?: unknown
    } | null

    const title = typeof body?.title === 'string' ? body.title : ''
    const content = typeof body?.content === 'string' ? body.content : ''
    const tags = Array.isArray(body?.tags)
      ? body.tags.filter((tag): tag is string => typeof tag === 'string')
      : []
    const clubId = typeof body?.clubId === 'string' ? body.clubId : null

    const created = await createCommunityDiscussion(userId, {
      title,
      content,
      tags,
      clubId,
    })
    return jsonOk(created, { status: 201 })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to create community discussion', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_CREATING_DISCUSSION'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
