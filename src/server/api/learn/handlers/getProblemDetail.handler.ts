import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parsePositiveIdParam } from '@/server/api/learn/utils/parsePositiveIdParam'
import { getAssignmentProblemDetailForUser } from '@/server/learn/services/getProblemDetail.service'

export async function handleGetProblemDetail(
  request: Request,
  assignmentIdParam: string,
  problemIdParam: string,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const assignmentId = parsePositiveIdParam(assignmentIdParam, 'INVALID_ASSIGNMENT_ID')
    const problemId = parsePositiveIdParam(problemIdParam, 'INVALID_PROBLEM_ID')
    const detail = await getAssignmentProblemDetailForUser(
      userId,
      assignmentId,
      problemId,
    )
    return jsonOk(detail)
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
