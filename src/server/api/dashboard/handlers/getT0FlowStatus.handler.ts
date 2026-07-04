import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getT0FlowStatus } from '@/server/api/dashboard/getT0FlowStatus.service'

export async function handleGetT0FlowStatus(): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const status = await getT0FlowStatus(userId)
    return jsonOk(status)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch T0 flow status', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_T0_FLOW_STATUS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
