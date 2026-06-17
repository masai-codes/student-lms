import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getCourseEvaluations } from '@/server/api/course/getCourseEvaluations.service'

export async function handleGetCourseEvaluations(
  request: Request,
  batchId: number,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const evaluations = await getCourseEvaluations(batchId, userId)
    return jsonOk({ evaluations })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch course evaluations', batchId, error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_FETCHING_COURSE_EVALUATIONS'))
    }
    return mapThrownErrorToResponse(error)
  }
}
