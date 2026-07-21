import { ApiError, isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { getT0FlowDocuments } from '@/server/api/dashboard/getT0FlowDocuments.service'

export async function handleGetT0FlowDocuments(
  request: Request,
): Promise<Response> {
  try {
    console.log('[student-status] /t0-flow-documents endpoint hit', request.url)
    const userId = await requireSessionUserId()
    const batchId = Number(new URL(request.url).searchParams.get('batchId'))
    if (!Number.isFinite(batchId) || batchId <= 0)
      throw new ApiError(400, 'INVALID_BATCH_ID')

    const result = await getT0FlowDocuments(userId, batchId)
    return jsonOk(result)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch document status', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_DOCUMENTS'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
