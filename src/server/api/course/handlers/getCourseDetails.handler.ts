import { isApiError, ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getCourseBatchData } from '@/server/api/course/getCourseBatchData.service'
import { getCourseEvaluations } from '@/server/api/course/getCourseEvaluations.service'
import { getCourseAttendance } from '@/server/api/course/getCourseAttendance.service'
import { getCourseCertificates } from '@/server/api/course/getCourseCertificates.service'

export async function handleGetCourseDetails(
  request: Request,
  batchId: number,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)

    // Re-read flags so this endpoint is self-contained
    const batchData = await getCourseBatchData(batchId, userId)
    if (!batchData) throw new ApiError(403, 'NOT_ENROLLED_IN_BATCH')

    const [evaluations, attendance, certificates] = await Promise.all([
      batchData.showEvaluationReport ? getCourseEvaluations(batchId, userId) : Promise.resolve([]),
      batchData.showAttendanceReport ? getCourseAttendance(batchId, userId) : Promise.resolve(null),
      getCourseCertificates(batchId, userId),
    ])

    return jsonOk({ evaluations, attendance, certificates })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch course details', batchId, error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_FETCHING_COURSE_DETAILS'))
    }
    return mapThrownErrorToResponse(error)
  }
}
