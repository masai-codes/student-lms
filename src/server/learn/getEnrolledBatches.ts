import { createServerFn } from '@tanstack/react-start'
import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'
import { getEnrolledBatchesForUser } from '@/server/learn/services/getEnrolledBatches.service'

export const getEnrolledBatches = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await getCurrentSessionUserId()

  if (!userId) {
    throw new Error('UNAUTHORIZED')
  }

  try {
    return await getEnrolledBatchesForUser(userId)
  } catch (error) {
    console.error('Failed to fetch enrolled batches', error)
    throw new Error('SERVER_ERROR_FETCHING_ENROLLED_BATCHES')
  }
})
