import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { updateMasaiverseClub } from '@/server/api/masaiverse-v2/services/updateClub.service'

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

export async function handleUpdateClub(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request.json().catch(() => null)) as {
      clubId?: unknown
      column?: unknown
      meta?: unknown
    } | null

    const result = await updateMasaiverseClub(userId, {
      clubId: Number(body?.clubId),
      column: asRecord(body?.column),
      meta: asRecord(body?.meta),
    })
    return jsonOk(result)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to update club', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_UPDATING_CLUB'))
    }
    return mapThrownErrorToResponse(error)
  }
}
