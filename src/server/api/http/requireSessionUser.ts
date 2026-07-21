import { ApiError } from '@/server/api/http/apiError'
import { getCurrentUserId } from '@/server/auth/getCurrentSessionUserId'

export async function requireSessionUserId(): Promise<number> {
  const userId = await getCurrentUserId()

  if (!userId) {
    throw new ApiError(401, 'UNAUTHORIZED')
  }

  return userId
}
