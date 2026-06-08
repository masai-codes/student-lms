import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { updateMasaiverseEvent } from '@/server/api/masaiverse-v2/services/updateEvent.service'

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

export async function handleUpdateEvent(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const body = (await request.json().catch(() => null)) as {
      eventId?: unknown
      column?: unknown
      meta?: unknown
    } | null

    const result = await updateMasaiverseEvent(userId, {
      eventId: Number(body?.eventId),
      column: asRecord(body?.column),
      meta: asRecord(body?.meta),
    })
    return jsonOk(result)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to update event', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_UPDATING_EVENT'))
    }
    return mapThrownErrorToResponse(error)
  }
}
