import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getCourseCertificates } from '@/server/api/course/getCourseCertificates.service'

export async function handleGetCourseCertificates(
  batchId: number,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const certificates = await getCourseCertificates(batchId, userId)
    return jsonOk({ certificates })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch course certificates', batchId, error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_COURSE_CERTIFICATES'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
