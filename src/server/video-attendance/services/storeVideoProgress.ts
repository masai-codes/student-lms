import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import {
  attendances,
  lectures,
  studentAttendances,
  videoAttendances,
} from '@/db/schema'
import { getIstNowSqlDatetime } from '@/server/time/istClock'
import { upgradeVideoAttendanceInline } from '@/server/video-attendance/services/upgradeVideoAttendanceInline'
import {
  calculateVideoWatchDurationPercentage,
  mergeIntervals,
  parseStoredIntervals,
} from '@/server/video-attendance/utils/watchPercentage'
import type { StoreVideoProgressInput } from '@/server/video-attendance/types'

// Video attendance / backfill "not minutes, a sentinel" magic values, kept
// identical to experience-api so cron/reporting reading these rows behave the
// same. `attendances.duration = 250` marks a video-originated backfill row.
const VIDEO_BACKFILL_ATTENDANCE_DURATION = 250

/**
 * Store a video-watch progress ping, natively (no experience-api call).
 *
 * Direct Drizzle port of experience-api's REST `storeVideoProgress`: upsert the
 * per-user `video_attendances` row (merge intervals, recompute watch %),
 * backfill the `attendances` / `student_attendances` rows on first watch, then
 * run the inline absent -> present upgrade. Cron/webhook reconciliation still
 * lives in experience-api; this inline write path lives here.
 */
export async function storeVideoProgress(
  input: StoreVideoProgressInput & { userId: number },
): Promise<boolean> {
  const { lectureId, userId, totalDuration, intervals, sessionToken } = input

  if (!Number.isFinite(lectureId) || lectureId <= 0) return false
  if (!Number.isFinite(userId) || userId <= 0) return false
  if (!Number.isFinite(totalDuration) || totalDuration < 1) return false
  if (!Array.isArray(intervals) || intervals.length === 0) return false

  try {
    const lectureRows = await db
      .select({
        category: lectures.category,
        hostId: lectures.userId,
        batchId: lectures.batchId,
        sectionId: lectures.sectionId,
        schedule: lectures.schedule,
      })
      .from(lectures)
      .where(eq(lectures.id, lectureId))
      .limit(1)

    const lecture = lectureRows[0]
    if (!lecture) return false

    const existingRows = await db
      .select({
        id: videoAttendances.id,
        intervals: videoAttendances.intervals,
        totalDuration: videoAttendances.totalDuration,
        sessionToken: videoAttendances.sessionToken,
      })
      .from(videoAttendances)
      .where(
        and(
          eq(videoAttendances.lectureId, lectureId),
          eq(videoAttendances.userId, userId),
        ),
      )
      .limit(1)

    const nowIst = getIstNowSqlDatetime()
    const existing = existingRows[0]

    if (existing) {
      const combined = [
        ...parseStoredIntervals(existing.intervals),
        ...intervals,
      ]
      const merged = mergeIntervals(combined)
      const totalForPct = totalDuration || existing.totalDuration || 1
      const watchPercentage = calculateVideoWatchDurationPercentage(
        merged,
        totalForPct,
      )

      await db
        .update(videoAttendances)
        .set({
          intervals: merged,
          duration: watchPercentage,
          totalDuration: totalDuration ?? existing.totalDuration ?? undefined,
          // Preserve the first-seen session token; only set if none stored yet.
          sessionToken: existing.sessionToken ?? sessionToken ?? undefined,
          updatedAt: nowIst,
        })
        .where(eq(videoAttendances.id, existing.id))
    } else {
      const merged = mergeIntervals([...intervals])
      const watchPercentage = calculateVideoWatchDurationPercentage(
        merged,
        totalDuration,
      )
      const schedule = lecture.schedule ?? nowIst
      const batchId = lecture.batchId ?? 0
      const sectionId = lecture.sectionId ?? 0

      await db.insert(videoAttendances).values({
        lectureId,
        userId,
        hostId: lecture.hostId,
        category: lecture.category,
        duration: watchPercentage,
        intervals: merged,
        totalDuration,
        batchId,
        sectionId,
        type: 'video',
        status: 1,
        schedule,
        createdAt: nowIst,
        updatedAt: nowIst,
        sessionToken: sessionToken ?? undefined,
      })

      // Backfill the sibling rows — create-if-missing only, never overwrite.
      const [existingAttendance, existingStudentAttendance] = await Promise.all(
        [
          db
            .select({ id: attendances.id })
            .from(attendances)
            .where(
              and(
                eq(attendances.lectureId, lectureId),
                eq(attendances.userId, userId),
              ),
            )
            .limit(1),
          db
            .select({ id: studentAttendances.id })
            .from(studentAttendances)
            .where(
              and(
                eq(studentAttendances.lectureId, lectureId),
                eq(studentAttendances.userId, userId),
              ),
            )
            .limit(1),
        ],
      )

      if (existingAttendance.length === 0) {
        await db.insert(attendances).values({
          lectureId,
          userId,
          hostId: lecture.hostId,
          category: lecture.category,
          duration: VIDEO_BACKFILL_ATTENDANCE_DURATION,
          batchId,
          sectionId,
          type: 'video',
          status: 0,
          schedule,
          createdAt: nowIst,
          updatedAt: nowIst,
        })
      }

      if (existingStudentAttendance.length === 0) {
        await db.insert(studentAttendances).values({
          lectureId,
          userId,
          schedule,
          sectionId,
          batchId,
          livePercentage: 0,
          liveAttendanceStatus: 0,
          videoPercentage: 0,
          videoAttendanceStatus: 0,
          includeVideoAttendance: 0,
          status: 0,
          meta: { notApplicable: true },
          createdAt: nowIst,
          updatedAt: nowIst,
        })
      }
    }

    // Real-time absent -> present upgrade (reads the % we just wrote).
    await upgradeVideoAttendanceInline({ lectureId, userId, totalDuration })

    return true
  } catch (error) {
    console.warn('storeVideoProgress: native write failed', error)
    return false
  }
}
