import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getMyCourses } from '@/server/api/my-courses/getMyLectures.service'

export async function handleGetMyCourses(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const data = await getMyCourses(userId)
    return jsonOk(data)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch my courses', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_MY_COURSES'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
