import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getDashboardSchedule } from '@/server/api/dashboard/getDashboardSchedule.service'
import { getDashboardBanners } from '@/server/api/dashboard/getDashboardBanners.service'
import { getDashboardActionBanners } from '@/server/api/dashboard/getDashboardActionBanners.service'
import { getDashboardPendingTasksCount } from '@/server/api/dashboard/getDashboardPendingTasksCount.service'

export async function handleGetDashboardLeftSection(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)

    const [schedule, banners, actionBanners, pendingTasksCount] = await Promise.all([
      getDashboardSchedule(userId),
      getDashboardBanners(userId),
      getDashboardActionBanners(userId),
      getDashboardPendingTasksCount(userId),
    ])

    return jsonOk({ schedule, banners, actionBanners, pendingTasksCount })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch dashboard left section data', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_FETCHING_DASHBOARD_LEFT_SECTION'))
    }
    return mapThrownErrorToResponse(error)
  }
}
