import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { cloneMasaiverseEvent } from '@/server/api/masaiverse-v2/services/cloneEvent.service'

export async function handleCloneEvent(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request.json().catch(() => null)) as {
      eventId?: unknown
    } | null
    const created = await cloneMasaiverseEvent(userId, Number(body?.eventId))
    return jsonOk(created, { status: 201 })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to clone event', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_CLONING_EVENT'))
    }
    return mapThrownErrorToResponse(error)
  }
}
