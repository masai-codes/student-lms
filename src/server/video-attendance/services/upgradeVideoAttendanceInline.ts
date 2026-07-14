import { and, eq } from 'drizzle-orm'

import { db } from '@/db'
import {
  lectures,
  sections,
  studentAttendances,
  videoAttendances,
} from '@/db/schema'
import { getIstNowSqlDatetime, parseIstToMs } from '@/server/time/istClock'

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
 * Fire-and-forget: never throws to the caller. Any failure is logged and the
 * safety-net cron still reconciles the row later.
 */

const IST_OFFSET_MS = (5 * 60 + 30) * 60_000
const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_CATCH_UP_DAYS = 30

type UpgradeArgs = {
  lectureId: number
  userId: number
  /** totalDuration reported by the player this request (seconds). */
  totalDuration: number | null | undefined
}

type SectionSettings = {
  considerVideoAttendanceForActualAttendance?: unknown
  minimumVideoWatchPercentage?: unknown
  catchUpDays?: unknown
}

/** End-of-day (23:59:59.999) IST for the given absolute instant, as epoch ms. */
function endOfDayIstMs(instantMs: number): number {
  const ist = new Date(instantMs + IST_OFFSET_MS)
  ist.setUTCHours(23, 59, 59, 999)
  return ist.getTime() - IST_OFFSET_MS
}

function parseSettings(raw: unknown): SectionSettings {
  if (raw == null) return {}
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as SectionSettings
    } catch {
      return {}
    }
  }
  if (typeof raw === 'object') return raw as SectionSettings
  return {}
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

    // One round-trip: the just-written watch % + the lecture/section eligibility inputs.
    const rows = await db
      .select({
        watchPercentage: videoAttendances.duration,
        schedule: lectures.schedule,
        deletedAt: lectures.deletedAt,
        sectionId: lectures.sectionId,
        settings: sections.settings,
      })
      .from(videoAttendances)
      .innerJoin(lectures, eq(lectures.id, videoAttendances.lectureId))
      .innerJoin(sections, eq(sections.id, lectures.sectionId))
      .where(
        and(
          eq(videoAttendances.lectureId, lectureId),
          eq(videoAttendances.userId, userId),
        ),
      )
      .limit(1)

    const row = rows[0]
    if (!row || row.deletedAt || row.schedule == null) return

    const settings = parseSettings(row.settings)
    if (settings.considerVideoAttendanceForActualAttendance !== true) return

    const threshold = Number(settings.minimumVideoWatchPercentage)
    if (!Number.isFinite(threshold)) return

    const newPercentage = Number(row.watchPercentage)
    if (!Number.isFinite(newPercentage) || newPercentage < threshold) return

    const catchUpDaysRaw = Number(settings.catchUpDays)
    const catchUpDays =
      Number.isFinite(catchUpDaysRaw) && catchUpDaysRaw > 0
        ? catchUpDaysRaw
        : DEFAULT_CATCH_UP_DAYS

    const scheduleMs = parseIstToMs(row.schedule)
    if (scheduleMs == null) return

    const deadlineMs = endOfDayIstMs(scheduleMs + catchUpDays * DAY_MS)
    if (Date.now() > deadlineMs) return

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
