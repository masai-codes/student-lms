import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getDashboardBanners } from '@/server/api/dashboard/getDashboardBanners.service'

export async function handleGetDashboardBanners(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const banners = await getDashboardBanners(userId)
    return jsonOk({ banners })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch dashboard banners', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_DASHBOARD_BANNERS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
