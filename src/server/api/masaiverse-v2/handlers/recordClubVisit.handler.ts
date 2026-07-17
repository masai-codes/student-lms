import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { recordClubVisit } from '@/server/api/masaiverse-v2/services/recordClubVisit.service'

export async function handleRecordClubVisit(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request.json().catch(() => null)) as {
      clubId?: unknown
    } | null

    const recorded = await recordClubVisit(userId, Number(body?.clubId))
    return jsonOk({ recorded })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to record club visit', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_RECORDING_CLUB_VISIT'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
