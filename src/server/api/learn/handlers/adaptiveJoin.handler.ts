import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { getAdaptiveJoinUrl } from '@/server/learn/services/adaptiveJoin.service'

/**
 * POST handler for the adaptive ("SAL") lecture join URL. Resolves the session
 * user, mints their cookie-less join token, and returns the tenant-scoped join
 * URL. Mirrors the ZEF `handleGetZoomRedirect` handler.
 */
export async function handleGetAdaptiveJoin(
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const lectureId = parsePositiveIdParam(lectureIdParam, 'INVALID_LECTURE_ID')
    const url = await getAdaptiveJoinUrl(userId, lectureId)
    return jsonOk({ url })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
