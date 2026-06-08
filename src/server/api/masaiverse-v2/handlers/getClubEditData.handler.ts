import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getClubEditData } from '@/server/api/masaiverse-v2/services/getClubEditData.service'

export async function handleGetClubEditData(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const clubId = Number(new URL(request.url).searchParams.get('clubId'))
    const data = await getClubEditData(userId, clubId)
    return jsonOk(data)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch club edit data', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_CLUB_EDIT_DATA'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
