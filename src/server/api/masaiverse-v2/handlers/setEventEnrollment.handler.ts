import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { setEventEnrollment } from '@/server/api/masaiverse-v2/services/setEventEnrollment.service'

export async function handleSetEventEnrollment(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request.json().catch(() => null)) as {
      eventId?: unknown
    } | null

    const state = await setEventEnrollment(userId, Number(body?.eventId))
    return jsonOk(state)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to enroll in event', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_ENROLLING_EVENT'))
    }
    return mapThrownErrorToResponse(error)
  }
}
