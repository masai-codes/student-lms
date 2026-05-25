import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getDashboardAnnouncements } from '@/server/api/dashboard/getDashboardAnnouncements.service'

export async function handleGetDashboardAnnouncements(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const announcements = await getDashboardAnnouncements(userId)
    return jsonOk({ announcements })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch dashboard announcements', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_DASHBOARD_ANNOUNCEMENTS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
