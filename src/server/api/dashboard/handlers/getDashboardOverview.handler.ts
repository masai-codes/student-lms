import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getDashboardOverview } from '@/server/api/dashboard/getDashboardOverview.service'

export async function handleGetDashboardOverview(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const overview = await getDashboardOverview(userId)
    return jsonOk(overview)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch dashboard overview', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_DASHBOARD_OVERVIEW'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
