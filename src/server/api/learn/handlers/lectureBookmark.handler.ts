import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import {
  addLearnEntityBookmark,
  removeLearnEntityBookmark,
} from '@/server/learn/services/learnEntityBookmark.service'

export async function handleAddLectureBookmark(
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const lectureId = parsePositiveIdParam(lectureIdParam, 'INVALID_LECTURE_ID')
    await addLearnEntityBookmark(userId, 'lecture', lectureId)
    return jsonOk({ isBookmarked: true })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}

export async function handleRemoveLectureBookmark(
  lectureIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const lectureId = parsePositiveIdParam(lectureIdParam, 'INVALID_LECTURE_ID')
    await removeLearnEntityBookmark(userId, 'lecture', lectureId)
    return jsonOk({ isBookmarked: false })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
