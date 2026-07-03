import { isApiError, ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getCourseBatchData } from '@/server/api/course/getCourseBatchData.service'
import { getCourseAgreements } from '@/server/api/course/getCourseAgreements.service'

export async function handleGetCourseBatchData(
  batchId: number,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const [batchData, agreements] = await Promise.all([
      getCourseBatchData(batchId, userId),
      getCourseAgreements(batchId, userId),
    ])
    if (!batchData) throw new ApiError(403, 'NOT_ENROLLED_IN_BATCH')
    return jsonOk({ batchData, agreements })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch course batch data', batchId, error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_COURSE_BATCH_DATA'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
