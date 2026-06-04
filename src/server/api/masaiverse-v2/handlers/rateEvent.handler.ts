import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { rateEvent } from '@/server/api/masaiverse-v2/services/rateEvent.service'

export async function handleRateEvent(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const body = (await request.json().catch(() => null)) as {
      eventId?: unknown
      rating?: unknown
      feedback?: unknown
    } | null

    const state = await rateEvent(
      userId,
      Number(body?.eventId),
      Number(body?.rating),
      body?.feedback,
    )
    return jsonOk(state)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to rate event', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_RATING_EVENT'))
    }
    return mapThrownErrorToResponse(error)
  }
}
