import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { createMasaiverseEvent } from '@/server/api/masaiverse-v2/services/createEvent.service'

export async function handleCreateEvent(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const created = await createMasaiverseEvent(userId)
    return jsonOk(created, { status: 201 })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to create event', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_CREATING_EVENT'))
    }
    return mapThrownErrorToResponse(error)
  }
}
