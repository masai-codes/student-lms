import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getEventEditData } from '@/server/api/masaiverse-v2/services/getEventEditData.service'

export async function handleGetEventEditData(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const eventId = Number(new URL(request.url).searchParams.get('eventId'))
    const data = await getEventEditData(userId, eventId)
    return jsonOk(data)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch event edit data', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_EVENT_EDIT_DATA'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
