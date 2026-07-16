import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { updateMasaiverseBanner } from '@/server/api/masaiverse-v2/services/updateBanner.service'

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

export async function handleUpdateBanner(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request.json().catch(() => null)) as {
      bannerId?: unknown
      column?: unknown
      meta?: unknown
    } | null

    const result = await updateMasaiverseBanner(userId, {
      bannerId: Number(body?.bannerId),
      column: asRecord(body?.column),
      meta: asRecord(body?.meta),
    })
    return jsonOk(result)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to update banner', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_UPDATING_BANNER'))
    }
    return mapThrownErrorToResponse(error)
  }
}
