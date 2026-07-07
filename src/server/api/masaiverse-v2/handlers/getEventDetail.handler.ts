import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getEventDetail } from '@/server/api/masaiverse-v2/services/getEventDetail.service'
import { canSeeUnpublished } from '@/server/api/masaiverse-v2/services/publishVisibility'

export async function handleGetEventDetail(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const eventId = Number(new URL(request.url).searchParams.get('eventId'))
    const event = await getEventDetail(
      eventId,
      userId,
      undefined,
      await canSeeUnpublished(userId),
    )
    if (!event) {
      throw new ApiError(404, 'EVENT_NOT_FOUND')
    }
    return jsonOk(event)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch event detail', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_EVENT_DETAIL'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
