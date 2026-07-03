import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getDashboardSchedule } from '@/server/api/dashboard/getDashboardSchedule.service'

export async function handleGetDashboardSchedule(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const schedule = await getDashboardSchedule(userId)
    return jsonOk({ schedule })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch dashboard schedule', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_DASHBOARD_SCHEDULE'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
