import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getCourseAttendance } from '@/server/api/course/getCourseAttendance.service'

export async function handleGetCourseAttendance(
  batchId: number,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const attendance = await getCourseAttendance(batchId, userId)
    return jsonOk(attendance)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch course attendance', batchId, error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_COURSE_ATTENDANCE'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
