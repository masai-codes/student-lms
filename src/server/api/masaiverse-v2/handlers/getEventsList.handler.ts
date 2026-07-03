import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getEventsList } from '@/server/api/masaiverse-v2/services/getEventsList.service'
import { canSeeUnpublished } from '@/server/api/masaiverse-v2/services/publishVisibility'

export async function handleGetEventsList(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const events = await getEventsList(userId, await canSeeUnpublished(userId))
    return jsonOk({ events })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch events list', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_EVENTS_LIST'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
