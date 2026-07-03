import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { createMasaiverseBanner } from '@/server/api/masaiverse-v2/services/createBanner.service'

export async function handleCreateBanner(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const created = await createMasaiverseBanner(userId)
    return jsonOk(created, { status: 201 })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to create banner', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_CREATING_BANNER'))
    }
    return mapThrownErrorToResponse(error)
  }
}
