import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getCalendarSubscriptionLink } from '@/server/api/calendar/getCalendarSubscription.service'

export async function handleGetCalendarSubscriptionLink(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const origin = new URL(request.url).origin
    const result = await getCalendarSubscriptionLink(userId, origin)
    return jsonOk(result)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch calendar subscription link', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_CALENDAR_SUBSCRIPTION_LINK'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
