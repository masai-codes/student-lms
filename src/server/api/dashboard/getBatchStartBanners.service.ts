import { and, gte, inArray, isNotNull, isNull, asc } from 'drizzle-orm'
import { resolveCourseTitle } from './courseTitle'
import { db } from '@/db'
import { batches } from '@/db/schema'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'
import { getIstNowSqlDatetime } from '@/server/time/istClock'

/** An upcoming-batch banner: which course starts, and when (IST). */
export interface BatchStartBanner {
  batchId: number
  courseTitle: string
  /** Raw start date, `YYYY-MM-DD` (IST). */
  startDate: string
  /** Display label, e.g. `12 Aug 2026`. */
  startDateLabel: string
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

/**
 * Formats a `YYYY-MM-DD` date (already IST wall-clock — no timezone math) as
 * `D Mon YYYY`, e.g. `2026-08-12` → `12 Aug 2026`. Returns the input unchanged
 * when it isn't in the expected shape.
 */
function formatStartDate(date: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date)
  if (!match) return date
  const [, year, month, day] = match
  const monthName = MONTHS[Number(month) - 1] ?? month
  return `${Number(day)} ${monthName} ${year}`
}

/**
 * Banners for batches the learner is enrolled in whose start date is today or later
 * (IST) — "Your course … will start on {date}". Sorted soonest-first; deduped to one
 * banner per batch. `[]` when none are upcoming.
 *
 * Enrollment comes from {@link getBatchIdsForEnrolledUser} (the single source of
 * truth — section-based, portal-scoped, and with cancelled batches already excluded).
 * `batches.starting` is a DATE stored as IST wall-clock, so it's compared against
 * today's IST date and formatted from its parts directly.
 */
export async function getBatchStartBanners(
  userId: number,
  now: Date = new Date(),
): Promise<Array<BatchStartBanner>> {
  const istToday = getIstNowSqlDatetime(now).slice(0, 10) // YYYY-MM-DD (IST)

  const enrolledBatchIds = await getBatchIdsForEnrolledUser(userId)
  if (enrolledBatchIds.length === 0) return []

  const rows = await db
    .select({
      id: batches.id,
      name: batches.name,
      meta: batches.meta,
      starting: batches.starting,
    })
    .from(batches)
    .where(
      and(
        inArray(batches.id, enrolledBatchIds),
        isNull(batches.deletedAt),
        isNotNull(batches.starting),
        gte(batches.starting, istToday),
      ),
    )
    .orderBy(asc(batches.starting))

  const seen = new Set<number>()
  const banners: Array<BatchStartBanner> = []
  for (const row of rows) {
    if (seen.has(row.id) || typeof row.starting !== 'string') continue
    seen.add(row.id)
    const startDate = row.starting.slice(0, 10)
    banners.push({
      batchId: row.id,
      courseTitle: resolveCourseTitle(row.meta, row.name) || String(row.id),
      startDate,
      startDateLabel: formatStartDate(startDate),
    })
  }

  return banners
}
