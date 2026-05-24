import { isApiError } from '@/server/api/http/apiError'
import { jsonOk, mapThrownErrorToResponse } from '@/server/api/http/responses'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { parseBatchLearningQuery } from '@/server/api/learn/utils/parseBatchLearningQuery'
import { getBatchLearningData } from '@/server/learn/services/getBatchLearningData.service'

export async function handleGetBatchLearningData(request: Request): Promise<Response> {
  try {
    await requireSessionUserId(request)
    const input = parseBatchLearningQuery(new URL(request.url))
    const data = await getBatchLearningData(input)
    return jsonOk(data)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to fetch batch learning data', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_FETCHING_BATCH_LEARNING_DATA'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
