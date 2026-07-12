import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import {
  addLearnEntityBookmark,
  removeLearnEntityBookmark,
} from '@/server/learn/services/learnEntityBookmark.service'

export async function handleAddAssignmentBookmark(
  assignmentIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const assignmentId = parsePositiveIdParam(
      assignmentIdParam,
      'INVALID_ASSIGNMENT_ID',
    )
    await addLearnEntityBookmark(userId, 'assignment', assignmentId)
    return jsonOk({ isBookmarked: true })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}

export async function handleRemoveAssignmentBookmark(
  assignmentIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const assignmentId = parsePositiveIdParam(
      assignmentIdParam,
      'INVALID_ASSIGNMENT_ID',
    )
    await removeLearnEntityBookmark(userId, 'assignment', assignmentId)
    return jsonOk({ isBookmarked: false })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
