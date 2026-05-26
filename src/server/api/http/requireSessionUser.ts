import { ApiError } from '@/server/api/http/apiError'
import { getUserIdFromCookieHeader } from '@/server/auth/getCurrentSessionUserId'

export async function requireSessionUserId(request: Request): Promise<number> {
  const userId = await getUserIdFromCookieHeader(request.headers.get('cookie'))

  if (!userId) {
    throw new ApiError(401, 'UNAUTHORIZED')
  }

  return userId
}
