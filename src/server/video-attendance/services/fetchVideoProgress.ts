import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import { videoAttendances } from '@/db/schema'
import { parseStoredIntervals } from '@/server/video-attendance/utils/watchPercentage'
import type { VideoProgressData } from '@/server/video-attendance/types'

/**
 * Read a user's video-watch progress for a lecture, natively (no experience-api
 * call). Port of experience-api's REST `getVideoProgress`: `lastWatchedPosition`
 * is the max raw interval end; `watchPercentage` is the stored `duration`.
 */
export async function fetchVideoProgress(
  lectureId: number,
  userId: number,
): Promise<VideoProgressData | null> {
  if (!Number.isFinite(lectureId) || lectureId <= 0) return null
  if (!Number.isFinite(userId) || userId <= 0) return null

  try {
    const rows = await db
      .select({
        intervals: videoAttendances.intervals,
        totalDuration: videoAttendances.totalDuration,
        duration: videoAttendances.duration,
      })
      .from(videoAttendances)
      .where(
        and(
          eq(videoAttendances.lectureId, lectureId),
          eq(videoAttendances.userId, userId),
        ),
      )
      .limit(1)

    const row = rows[0]
    const base: VideoProgressData = {
      lectureId,
      lastWatchedPosition: 0,
      totalDuration: null,
      watchPercentage: 0,
    }

    if (!row) return base

    const intervals = parseStoredIntervals(row.intervals)
    const lastWatchedPosition = intervals.reduce(
      (max, interval) => Math.max(max, interval.end),
      0,
    )

    return {
      lectureId,
      lastWatchedPosition,
      totalDuration: row.totalDuration ?? null,
      watchPercentage: row.duration ?? 0,
    }
  } catch (error) {
    // Keep the lecture page renderable if the read fails.
    console.warn('fetchVideoProgress: native read failed', error)
    return null
  }
}
