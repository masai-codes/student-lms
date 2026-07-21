import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import { videoAttendances } from '@/db/schema'
import { mergeIntervalsWithTolerance } from '@/server/video-attendance/utils/watchPercentage'
import type { VideoAttendanceIntervalsData } from '@/server/video-attendance/types'

/**
 * Read a user's tolerance-merged watch intervals for a lecture, natively (no
 * experience-api call). Port of experience-api's REST `getVideoIntervals`:
 * intervals are gap-merged (<= 2s) and `lastWatchedPosition` is the max end.
 */
export async function fetchVideoAttendanceIntervals(
  lectureId: number,
  userId: number,
): Promise<VideoAttendanceIntervalsData | null> {
  if (!Number.isFinite(lectureId) || lectureId <= 0) return null
  if (!Number.isFinite(userId) || userId <= 0) return null

  try {
    const rows = await db
      .select({ intervals: videoAttendances.intervals })
      .from(videoAttendances)
      .where(
        and(
          eq(videoAttendances.lectureId, lectureId),
          eq(videoAttendances.userId, userId),
        ),
      )
      .limit(1)

    const row = rows[0]
    if (!row || !row.intervals) {
      return { lectureId, lastWatchedPosition: 0, intervals: [] }
    }

    const merged = mergeIntervalsWithTolerance(row.intervals)
    const lastWatchedPosition = merged.reduce(
      (max, interval) => Math.max(max, interval.end),
      0,
    )

    return { lectureId, lastWatchedPosition, intervals: merged }
  } catch (error) {
    console.warn('fetchVideoAttendanceIntervals: native read failed', error)
    return null
  }
}
