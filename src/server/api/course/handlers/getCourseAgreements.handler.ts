import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getCourseAgreements } from '@/server/api/course/getCourseAgreements.service'

export async function handleGetCourseAgreements(
  batchId: number,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const agreements = await getCourseAgreements(batchId, userId)
    return jsonOk({ agreements })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch course agreements', batchId, error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_COURSE_AGREEMENTS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
