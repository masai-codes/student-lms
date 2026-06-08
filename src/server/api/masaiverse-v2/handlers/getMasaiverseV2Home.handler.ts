import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getMasaiverseV2Home } from '@/server/api/masaiverse-v2/getMasaiverseV2Home.service'
import { canSeeUnpublished } from '@/server/api/masaiverse-v2/services/publishVisibility'

export async function handleGetMasaiverseV2Home(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const home = await getMasaiverseV2Home(
      userId,
      undefined,
      await canSeeUnpublished(userId),
    )
    return jsonOk(home)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch masaiverse-v2 home', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_MASAIVERSE_V2_HOME'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
