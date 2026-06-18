import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getMasaiverseBanners } from '@/server/api/masaiverse-v2/services/getBanners.service'
import { canSeeUnpublished } from '@/server/api/masaiverse-v2/services/publishVisibility'

export async function handleGetBanners(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const banners = await getMasaiverseBanners(await canSeeUnpublished(userId))
    return jsonOk({ banners })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch banners', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_BANNERS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
