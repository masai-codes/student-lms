import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getDashboardActionBanners } from '@/server/api/dashboard/getDashboardActionBanners.service'

export async function handleGetDashboardActionBanners(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const result = await getDashboardActionBanners(userId)
    return jsonOk(result)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch dashboard action banners', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_DASHBOARD_ACTION_BANNERS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
