import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import { studentAttendances, videoAttendances } from '@/db/schema'
import { getIstNowSqlDatetime } from '@/server/time/istClock'
import { getLectureEligibility } from '@/server/video-attendance/services/lectureEligibilityCache'

/**
 * Inline "absent -> present via recording" upgrade.
 *
 * Port of experience-api `inlineAttendanceUpgrade.ts` + `getLectureEligibility`,
 * run here (against the shared DB) instead of inside the upstream write endpoint
 * — the experience-api REST endpoint the new LMS proxies to never fires the
 * upgrade, so without this a student who watches the recording only flips to
 * present on the twice-daily cron. Running it here gives the same real-time
 * upgrade the old GraphQL path had, with all changes confined to student-lms.
 *
 * The lecture/section eligibility inputs (deadline + watch-% threshold) come
 * from {@link getLectureEligibility}, which caches them in Redis on the hot
 * path; only the freshly-written watch % is read live here.
 *
 * Fire-and-forget: never throws to the caller. Any failure is logged and the
 * safety-net cron still reconciles the row later.
 */

type UpgradeArgs = {
  lectureId: number
  userId: number
  /** totalDuration reported by the player this request (seconds). */
  totalDuration: number | null | undefined
}

export async function upgradeVideoAttendanceInline(
  args: UpgradeArgs,
): Promise<void> {
  const { lectureId, userId, totalDuration } = args

  try {
    // Guard against the totalDuration=0/missing case where percentage math
    // explodes and would otherwise trigger a false crossing.
    if (
      totalDuration == null ||
      !Number.isFinite(totalDuration) ||
      totalDuration <= 0
    ) {
      return
    }

    // Cached: is this lecture video-eligible, and until when / above what %?
    const eligibility = await getLectureEligibility(lectureId)
    if (!eligibility.enabled) return

    // Live: the watch % we just wrote for this (lecture, user).
    const rows = await db
      .select({ watchPercentage: videoAttendances.duration })
      .from(videoAttendances)
      .where(
        and(
          eq(videoAttendances.lectureId, lectureId),
          eq(videoAttendances.userId, userId),
        ),
      )
      .limit(1)

    const row = rows[0]
    if (!row) return

    const newPercentage = Number(row.watchPercentage)
    if (
      !Number.isFinite(newPercentage) ||
      newPercentage < eligibility.threshold
    )
      return

    if (Date.now() > eligibility.deadline) return

    // Flip only a still-absent, live-absent row. Scoped WHERE = idempotent:
    // once present the update matches 0 rows, so repeated pings are harmless.
    const nowIst = getIstNowSqlDatetime()
    await db
      .update(studentAttendances)
      .set({
        status: 1,
        videoAttendanceStatus: 1,
        videoPercentage: Math.min(100, Math.max(0, Math.round(newPercentage))),
        videoLastUpdatedAt: nowIst,
        // The upstream first-watch backfill seeds the row with
        // include_video_attendance = 0, which would leave it internally
        // inconsistent (status:1 but flag:0) and invisible to consumers that
        // filter on include_video_attendance = 1. Reaching here means the
        // section is video-eligible, so correct the flag at the source.
        includeVideoAttendance: 1,
        updatedAt: nowIst,
      })
      .where(
        and(
          eq(studentAttendances.lectureId, lectureId),
          eq(studentAttendances.userId, userId),
          eq(studentAttendances.status, 0),
          eq(studentAttendances.liveAttendanceStatus, 0),
        ),
      )
  } catch (error) {
    console.warn(
      `upgradeVideoAttendanceInline failed lecture=${lectureId} user=${userId}:`,
      error,
    )
  }
}
