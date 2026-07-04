import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { awardManualPoints } from '@/server/api/masaiverse-v2/services/awardManualPoints.service'

/** `null`/empty club means a community-wide award; anything else coerces to a number. */
function parseClubId(value: unknown): number | null {
  return value == null || value === '' ? null : Number(value)
}

export async function handleAwardManualPoints(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const body = (await request.json().catch(() => null)) as {
      targetUserId?: unknown
      points?: unknown
      clubId?: unknown
    } | null

    const result = await awardManualPoints(userId, {
      targetUserId: Number(body?.targetUserId),
      points: Number(body?.points),
      clubId: parseClubId(body?.clubId),
    })
    return jsonOk(result, { status: 201 })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to award manual points', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_AWARDING_POINTS'))
    }
    return mapThrownErrorToResponse(error)
  }
}
