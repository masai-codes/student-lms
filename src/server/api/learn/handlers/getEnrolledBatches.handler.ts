import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getEnrolledBatchesForUser } from '@/server/learn/services/getEnrolledBatches.service'

export async function handleGetEnrolledBatches(request: Request): Promise<Response> {
  try {
    const userId = await requireSessionUserId(request)
    const batches = await getEnrolledBatchesForUser(userId)
    return jsonOk({ batches })
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch enrolled batches', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_ENROLLED_BATCHES'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
