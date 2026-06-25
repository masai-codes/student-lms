import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { batches, lectures, users } from '@/db/schema'
import { generateZoomRedirectionToken } from '@/server/learn/utils/zoomRedirectionToken'

const ZOOM_MASAI_BASE_URL = 'https://zoom.masaischool.com'
const ZOOM_IHUB_BASE_URL = 'https://zoom.ihubiitrcourses.org'

/** iHub batches redirect to the iHub ZEF host; everything else to Masai. */
async function resolveZoomBaseUrl(lectureId: number): Promise<string> {
  const lectureRows = await db
    .select({ batchId: lectures.batchId })
    .from(lectures)
    .where(eq(lectures.id, lectureId))
    .limit(1)

  const batchId = lectureRows[0]?.batchId
  if (batchId == null) return ZOOM_MASAI_BASE_URL

  const batchRows = await db
    .select({ duration: batches.duration })
    .from(batches)
    .where(eq(batches.id, batchId))
    .limit(1)

  return batchRows[0]?.duration?.toLowerCase() === 'ihub'
    ? ZOOM_IHUB_BASE_URL
    : ZOOM_MASAI_BASE_URL
}

/**
 * Builds the ZEF ("new zoom redirection") join URL for a lecture. Token minting
 * runs locally in the new LMS (see `zoomRedirectionToken`); no experience-api call.
 * Throws `ZOOM_REDIRECT_FORBIDDEN` / `ZOOM_REDIRECT_FAILED`.
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

  const result = await generateZoomRedirectionToken({
    lectureId: String(lectureId),
    user,
  })
  if (!result.ok) {
    throw new Error(
      result.status === 403 ? 'ZOOM_REDIRECT_FORBIDDEN' : 'ZOOM_REDIRECT_FAILED',
    )
  }

  const baseUrl = await resolveZoomBaseUrl(lectureId)
  return `${baseUrl}/?token=${encodeURIComponent(result.token)}`
}
