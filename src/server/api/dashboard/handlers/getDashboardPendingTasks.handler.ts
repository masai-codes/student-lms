import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getDashboardPendingTasks } from '@/server/api/dashboard/getDashboardPendingTasks.service'

export async function handleGetDashboardPendingTasks(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const pendingTasks = await getDashboardPendingTasks(userId)
    return jsonOk({ pendingTasks })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch dashboard pending tasks', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_DASHBOARD_PENDING_TASKS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
