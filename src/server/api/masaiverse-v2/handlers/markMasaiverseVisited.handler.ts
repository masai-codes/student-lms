import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { markMasaiverseVisited } from '@/server/api/masaiverse-v2/markMasaiverseVisited.service'

export async function handleMarkMasaiverseVisited(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    await markMasaiverseVisited(userId)
    return jsonOk({ success: true })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to mark masaiverse visited', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_MARKING_MASAIVERSE_VISITED'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
