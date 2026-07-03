import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getClubEvents } from '@/server/api/masaiverse-v2/services/getClubEvents.service'
import { canSeeUnpublished } from '@/server/api/masaiverse-v2/services/publishVisibility'

export async function handleGetClubEvents(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const clubId = Number(new URL(request.url).searchParams.get('clubId'))
    const clubEvents = await getClubEvents(
      clubId,
      undefined,
      await canSeeUnpublished(userId),
    )
    if (!clubEvents) {
      throw new ApiError(404, 'CLUB_NOT_FOUND')
    }
    return jsonOk(clubEvents)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch club events', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_CLUB_EVENTS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
