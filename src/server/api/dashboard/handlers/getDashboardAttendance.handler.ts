import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getDashboardAttendance } from '@/server/api/dashboard/getDashboardAttendance.service'

export async function handleGetDashboardAttendance(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const attendance = await getDashboardAttendance(userId)
    return jsonOk({ attendance })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch dashboard attendance', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_DASHBOARD_ATTENDANCE'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
