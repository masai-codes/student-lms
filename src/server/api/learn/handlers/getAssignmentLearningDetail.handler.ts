import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { getAssignmentLearningDetailForUser } from '@/server/learn/services/getAssignmentLearningDetail.service'

export async function handleGetAssignmentLearningDetail(
  request: Request,
  assignmentIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const assignmentId = parsePositiveIdParam(
      assignmentIdParam,
      'INVALID_ASSIGNMENT_ID',
    )
    const detail = await getAssignmentLearningDetailForUser(
      userId,
      assignmentId,
    )
    return jsonOk(detail)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
