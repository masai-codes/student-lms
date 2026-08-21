import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { getInLecturePopupElementsForUser } from '@/server/learn/services/getInLecturePopupElementsForUser.service'

export async function handleGetInLecturePopupElements(
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const lectureId = parsePositiveIdParam(lectureIdParam, 'INVALID_LECTURE_ID')

    const result = await getInLecturePopupElementsForUser(userId, lectureId)
    return jsonOk(result)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
