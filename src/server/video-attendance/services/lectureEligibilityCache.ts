import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { lectures, sections } from '@/db/schema'
import {
  cacheDel,
  cacheGetJson,
  cacheScanKeys,
  cacheSetJson,
} from '@/server/redis/cache'
import { parseIstToMs } from '@/server/time/istClock'

/**
 * Cache of "does watching this lecture's recording count toward attendance?".
 *
 * Drizzle port of experience-api's `lectureEligibilityCache`. This is read on
 * the video-attendance hot path (`upgradeVideoAttendanceInline`), which runs on
 * every progress ping — the same lecture is watched by many students across
 * many PM2 workers, so a shared cache removes a lecture+section lookup from each
 * ping. The dynamic watch % is NOT cached (it changes every ping); only the
 * static eligibility inputs (section settings + schedule-derived deadline) are.
 *
 * TTL: experience-api derives the TTL from the deadline (up to 30 days) because
 * it invalidates the cache in-process whenever section settings change. Section
 * settings are edited in experience-api, NOT here, so student-lms can't observe
 * that write — instead we cap the TTL to a short bounded window (default 10 min)
 * so stale eligibility self-heals quickly. Since the heartbeat fires every few
 * seconds, even a short TTL eliminates ~all repeated lookups. The two exported
 * `invalidate*` helpers exist for a future write path / internal endpoint.
 */

export type EligibilityValue =
  | { enabled: true; deadline: number; threshold: number; sectionId: number }
  | { enabled: false }

const KEY_PREFIX = 'lecture-eligibility'
const IST_OFFSET_MS = (5 * 60 + 30) * 60_000
const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_CATCH_UP_DAYS = 30

const TTL_SECONDS = Math.max(
  30,
  Number(process.env.LECTURE_ELIGIBILITY_TTL_SECONDS ?? 600),
)

// Section-keyed key is what pattern-based invalidation walks; the lookup key is
// what the hot path reads with only a lectureId. Both hold the same payload.
const sectionKey = (sectionId: number, lectureId: number): string =>
  `${KEY_PREFIX}:${sectionId}:${lectureId}`
const lookupKey = (lectureId: number): string =>
  `${KEY_PREFIX}:lookup:${lectureId}`

/** End-of-day (23:59:59.999) IST for the given absolute instant, as epoch ms. */
function endOfDayIstMs(instantMs: number): number {
  const ist = new Date(instantMs + IST_OFFSET_MS)
  ist.setUTCHours(23, 59, 59, 999)
  return ist.getTime() - IST_OFFSET_MS
}

function parseSettings(raw: unknown): Record<string, unknown> {
  if (raw == null) return {}
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, unknown>
    } catch {
      return {}
    }
  }
  if (typeof raw === 'object') return raw as Record<string, unknown>
  return {}
}

type Resolved = { value: EligibilityValue; sectionId: number | null }

async function resolveFromDb(lectureId: number): Promise<Resolved> {
  const rows = await db
    .select({
      schedule: lectures.schedule,
      sectionId: lectures.sectionId,
      deletedAt: lectures.deletedAt,
      settings: sections.settings,
    })
    .from(lectures)
    .innerJoin(sections, eq(sections.id, lectures.sectionId))
    .where(eq(lectures.id, lectureId))
    .limit(1)

  const row = rows[0]
  if (!row || row.deletedAt || row.sectionId == null || row.schedule == null) {
    return { value: { enabled: false }, sectionId: row?.sectionId ?? null }
  }

  const sectionId = row.sectionId
  const settings = parseSettings(row.settings)

  if (settings.considerVideoAttendanceForActualAttendance !== true) {
    return { value: { enabled: false }, sectionId }
  }

  const threshold = Number(settings.minimumVideoWatchPercentage)
  if (!Number.isFinite(threshold)) {
    return { value: { enabled: false }, sectionId }
  }

  const catchUpDaysRaw = Number(settings.catchUpDays)
  const catchUpDays =
    Number.isFinite(catchUpDaysRaw) && catchUpDaysRaw > 0
      ? catchUpDaysRaw
      : DEFAULT_CATCH_UP_DAYS

  const scheduleMs = parseIstToMs(row.schedule)
  if (scheduleMs == null) {
    return { value: { enabled: false }, sectionId }
  }

  const deadline = endOfDayIstMs(scheduleMs + catchUpDays * DAY_MS)
  return { value: { enabled: true, deadline, threshold, sectionId }, sectionId }
}

/** Cached eligibility for a lecture. Falls back to a live DB resolve on miss. */
export async function getLectureEligibility(
  lectureId: number,
): Promise<EligibilityValue> {
  const cached = await cacheGetJson<EligibilityValue>(lookupKey(lectureId))
  if (cached) return cached

  const { value, sectionId } = await resolveFromDb(lectureId)

  await cacheSetJson(lookupKey(lectureId), value, TTL_SECONDS)
  if (sectionId != null) {
    await cacheSetJson(sectionKey(sectionId, lectureId), value, TTL_SECONDS)
  }
  return value
}

/** Invalidate one lecture (both keys). */
async function invalidateLectureEligibility(
  lectureId: number,
  sectionId: number,
): Promise<void> {
  await cacheDel(sectionKey(sectionId, lectureId), lookupKey(lectureId))
}

/** Invalidate every cached lecture in a section (e.g. after a settings change). */
async function invalidateSectionEligibility(sectionId: number): Promise<void> {
  const keys = await cacheScanKeys(`${KEY_PREFIX}:${sectionId}:*`)
  const toDelete = keys.flatMap((key) => {
    const lectureId = Number(key.split(':').pop())
    return Number.isFinite(lectureId) ? [key, lookupKey(lectureId)] : [key]
  })
  await cacheDel(...toDelete)
}
