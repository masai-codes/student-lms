import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { deleteMasaiverseBanner } from '@/server/api/masaiverse-v2/services/deleteBanner.service'

export async function handleDeleteBanner(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request.json().catch(() => null)) as {
      bannerId?: unknown
    } | null

    const result = await deleteMasaiverseBanner(userId, Number(body?.bannerId))
    return jsonOk(result)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to delete banner', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_DELETING_BANNER'))
    }
    return mapThrownErrorToResponse(error)
  }
}
