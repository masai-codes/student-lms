import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { users } from '@/db/schema'
import { generateZoomRedirectionUrl } from '@/server/learn/utils/zoomRedirectionToken'

/**
 * Builds the ZEF ("new zoom redirection") join URL for a lecture. Token minting
 * and platform selection run locally in the new LMS (see `zoomRedirectionToken`);
 * no experience-api call. Throws `ZOOM_REDIRECT_FORBIDDEN` / `ZOOM_REDIRECT_FAILED`.
 */
export async function getZoomRedirectUrl(
  userId: number,
  lectureId: number,
): Promise<string> {
  const userRows = await db
    .select({
      id: users.id,
      role: users.role,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const user = userRows.at(0)
  if (!user) {
    throw new Error('ZOOM_REDIRECT_FAILED')
  }

  const result = await generateZoomRedirectionUrl({
    lectureId: String(lectureId),
    user,
  })
  if (!result.ok) {
    throw new Error(
      result.status === 403
        ? 'ZOOM_REDIRECT_FORBIDDEN'
        : 'ZOOM_REDIRECT_FAILED',
    )
  }

  return result.url
}
