import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getDashboardAnnouncements } from '@/server/api/dashboard/getDashboardAnnouncements.service'
import { getProductUpdates } from '@/server/api/dashboard/getProductUpdates.service'
import { getLmsSupportInfo } from '@/server/api/dashboard/getLmsSupportInfo.service'
import { getDashboardAttendance } from '@/server/api/dashboard/getDashboardAttendance.service'
import { getEnrolledBatchesForUser } from '@/server/learn/services/getEnrolledBatches.service'

export async function handleGetDashboardRightSection(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)

    const [announcements, productUpdates, lmsSupport, attendance, batches] = await Promise.all([
      getDashboardAnnouncements(userId),
      getProductUpdates(),
      getLmsSupportInfo(),
      getDashboardAttendance(userId),
      getEnrolledBatchesForUser(userId),
    ])

    return jsonOk({ announcements, productUpdates, lmsSupport, attendance, batches })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch dashboard right section data', error)
      return mapThrownErrorToResponse(new Error('SERVER_ERROR_FETCHING_DASHBOARD_RIGHT_SECTION'))
    }
    return mapThrownErrorToResponse(error)
  }
}
