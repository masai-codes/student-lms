import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getCalendarEvents } from '@/server/api/calendar/getCalendarEvents.service'
import { parseCalendarWindow } from '@/server/api/calendar/calendarWindow'

/** Optional positive-int `batchId`; anything else malformed → 400. */
function parseBatchIdParam(value: string | null): number | null {
  if (value == null || value === '') return null
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, 'INVALID_CALENDAR_BATCH', 'Invalid batchId')
  }
  return parsed
}

export async function handleGetCalendarEvents(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const params = new URL(request.url).searchParams
    const window = parseCalendarWindow(
      params.get('start') ?? undefined,
      params.get('end') ?? undefined,
    )
    const batchId = parseBatchIdParam(params.get('batchId'))
    const result = await getCalendarEvents(userId, window, batchId)
    return jsonOk(result)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch calendar events', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_CALENDAR_EVENTS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
