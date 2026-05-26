import type {
  GetBatchLearningDataInput,
  GetBatchLearningDataResponse,
} from '@/server/learn/types'
import { getBatchLearningData as getBatchLearningDataService } from '@/server/learn/services/getBatchLearningData.service'

/** @deprecated Use GET `/api/learn/batch-data` via `fetchBatchLearningDataFromApi`. */
export async function getBatchLearningDataHandler({
  data,
  userId,
}: {
  data: GetBatchLearningDataInput
  userId: number
}): Promise<GetBatchLearningDataResponse> {
  try {
    return await getBatchLearningDataService(data, userId)
  } catch (error) {
    console.error('Failed to fetch batch learning data', error)
    throw new Error('SERVER_ERROR_FETCHING_BATCH_LEARNING_DATA')
  }
}
