import { getDashboardOverviewApp } from '@/server/api/dashboard/getDashboardOverviewApp.service'
import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'

export async function handleGetDashboardOverviewApp(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const overview = await getDashboardOverviewApp(userId, new Date())
    return jsonOk(overview)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch dashboard overview-app', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_DASHBOARD_OVERVIEW_APP'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
