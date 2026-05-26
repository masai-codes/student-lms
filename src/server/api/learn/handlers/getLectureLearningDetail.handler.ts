import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { getLectureLearningDetailForUser } from '@/server/learn/services/getLectureLearningDetail.service'

export async function handleGetLectureLearningDetail(
  request: Request,
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const lectureId = parsePositiveIdParam(lectureIdParam, 'INVALID_LECTURE_ID')
    const detail = await getLectureLearningDetailForUser(userId, lectureId)
    return jsonOk(detail)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
