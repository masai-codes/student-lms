import { createServerFn } from '@tanstack/react-start'
import type {
  GetBatchLearningDataInput,
  GetBatchLearningDataResponse,
} from '@/server/learn/types'
import { getBatchLearningData as getBatchLearningDataService } from '@/server/learn/services/getBatchLearningData.service'

export const getBatchLearningData = createServerFn({ method: 'GET' })
  .inputValidator((data: GetBatchLearningDataInput) => data)
  .handler(getBatchLearningDataHandler)

export async function getBatchLearningDataHandler({
  data,
}: {
  data: GetBatchLearningDataInput
}): Promise<GetBatchLearningDataResponse> {
  try {
    return await getBatchLearningDataService(data)
  } catch (error) {
    console.error('Failed to fetch batch learning data', error)
    throw new Error('SERVER_ERROR_FETCHING_BATCH_LEARNING_DATA')
  }
}
