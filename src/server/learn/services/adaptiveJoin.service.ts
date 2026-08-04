import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { batches, lectures } from '@/db/schema'
import { mintAdaptiveJoinToken } from '@/server/learn/utils/adaptiveJoinToken'
import {
  isAdaptiveLectureLink,
  toLectureScopedAdaptiveLink,
} from '@/server/learn/utils/toLectureScopedAdaptiveLink'

// iHub lectures must hit the iHub experience-api host so the iHub session cookie
// (scoped to `.ihubiitrcourses.org`) is sent to the join endpoint. Masai lectures
// keep the host baked into the stored zoom_link. Mirrors zoomRedirect.service.
const EXPERIENCE_API_IHUB_BASE_URL = 'https://experience-api.ihubiitrcourses.org'

/**
 * Returns the iHub experience-api base for iHub batches, or undefined otherwise
 * (Masai keeps the stored host). Resolved from `batches.duration === 'ihub'`,
 * the same signal the ZEF host selection uses.
 */
async function resolveExperienceApiBaseUrl(
  batchId: number | null,
): Promise<string | undefined> {
  if (batchId == null) return undefined

  const batchRows = await db
    .select({ duration: batches.duration })
    .from(batches)
    .where(eq(batches.id, batchId))
    .limit(1)

  return batchRows[0]?.duration?.toLowerCase() === 'ihub'
    ? EXPERIENCE_API_IHUB_BASE_URL
    : undefined
}

/**
 * Builds the adaptive ("SAL") lecture join URL for a user: a lecture-scoped link
 * pointed at the tenant's experience-api host plus a cookie-less `?token=`
 * fallback the experience-api join handler verifies. Token minting runs locally
 * (mirrors the ZEF flow); no experience-api call. The same URL doubles as the
 * "watch recording" link once the meeting has ended (the join handler 302s to the
 * recording). Throws `ADAPTIVE_JOIN_NOT_FOUND` / `ADAPTIVE_JOIN_FAILED`.
 */
export async function getAdaptiveJoinUrl(
  userId: number,
  lectureId: number,
): Promise<string> {
  const lectureRows = await db
    .select({ zoomLink: lectures.zoomLink, batchId: lectures.batchId })
    .from(lectures)
    .where(eq(lectures.id, lectureId))
    .limit(1)

  const lecture = lectureRows.at(0)
  if (!lecture || !isAdaptiveLectureLink(lecture.zoomLink)) {
    throw new Error('ADAPTIVE_JOIN_NOT_FOUND')
  }

  const baseUrl = await resolveExperienceApiBaseUrl(lecture.batchId)
  const token = mintAdaptiveJoinToken(userId)
  const url = toLectureScopedAdaptiveLink(
    lecture.zoomLink,
    lectureId,
    token,
    baseUrl,
  )
  if (!url) {
    throw new Error('ADAPTIVE_JOIN_FAILED')
  }
  return url
}
