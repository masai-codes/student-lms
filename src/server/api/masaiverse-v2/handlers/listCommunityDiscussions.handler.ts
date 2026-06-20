import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getCommunityDiscussions } from '@/server/api/masaiverse-v2/services/getCommunityDiscussions.service'
import { canSeeUnpublished } from '@/server/api/masaiverse-v2/services/publishVisibility'

const DEFAULT_LIMIT = 5
const MAX_LIMIT = 20

export async function handleListCommunityDiscussions(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const params = new URL(request.url).searchParams
    const offset = Math.max(0, Number(params.get('offset')) || 0)
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Number(params.get('limit')) || DEFAULT_LIMIT),
    )
    const search = params.get('q') ?? ''
    const clubId = params.get('clubId')

    const page = await getCommunityDiscussions(
      userId,
      offset,
      limit,
      search,
      clubId,
      await canSeeUnpublished(userId),
    )
    return jsonOk(page)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to list discussions', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_DISCUSSIONS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
