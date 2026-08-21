import { ApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { listLearnDiscussionsForBatch } from '@/server/new-discussions/services/listLearnDiscussionsForBatch'

export async function handleListLearnDiscussions(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()

    const url = new URL(request.url)
    const batchIdParam = url.searchParams.get('batchId')
    const batchId = batchIdParam ? Number(batchIdParam) : NaN
    if (!Number.isFinite(batchId) || batchId <= 0) {
      throw new ApiError(400, 'INVALID_BATCH_ID')
    }

    const discussions = await listLearnDiscussionsForBatch(userId, batchId)
    return jsonOk({ discussions })
  } catch (error) {
    return mapThrownErrorToResponse(error)
  }
}
