import { ApiError } from '@/server/api/http/apiError'
import { getUserIdFromRequest } from '@/server/auth/getCurrentSessionUserId'

export async function requireSessionUserId(request: Request): Promise<number> {
  const userId = await getUserIdFromRequest(request)

  if (!userId) {
    throw new ApiError(401, 'UNAUTHORIZED')
  }

  return userId
}
