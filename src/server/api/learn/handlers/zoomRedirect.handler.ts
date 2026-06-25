import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { getZoomRedirectUrl } from '@/server/learn/services/zoomRedirect.service'

export async function handleGetZoomRedirect(
  request: Request,
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const lectureId = parsePositiveIdParam(lectureIdParam, 'INVALID_LECTURE_ID')
    const url = await getZoomRedirectUrl(userId, lectureId)
    return jsonOk({ url })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
