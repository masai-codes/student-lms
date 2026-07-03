import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { setClubMembership } from '@/server/api/masaiverse-v2/services/setClubMembership.service'

export async function handleSetClubMembership(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request.json().catch(() => null)) as {
      clubId?: unknown
      join?: unknown
    } | null

    const state = await setClubMembership(
      userId,
      Number(body?.clubId),
      body?.join === true,
    )
    return jsonOk(state)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to update club membership', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_UPDATING_CLUB_MEMBERSHIP'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
