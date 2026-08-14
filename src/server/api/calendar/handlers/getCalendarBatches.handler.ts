import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getCalendarBatches } from '@/server/api/calendar/getCalendarBatches.service'

export async function handleGetCalendarBatches(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const result = await getCalendarBatches(userId)
    return jsonOk(result)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch calendar batches', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_CALENDAR_BATCHES'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
