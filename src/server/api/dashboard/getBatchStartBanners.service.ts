import { sql } from 'drizzle-orm'
import { resolveCourseTitle } from './courseTitle'
import { db } from '@/db'
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

function normalizeRows<T>(result: unknown): Array<T> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<T>
    return result as Array<T>
  }
  if (result && typeof result === 'object' && 'rows' in result && Array.isArray((result).rows)) {
    return (result as { rows: Array<T> }).rows
  }
  return []
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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

interface BatchStartRow {
  batch_id: number
  batch_name: string | null
  batch_meta: unknown
  starting: string | null
}

/**
 * Banners for batches the learner is enrolled in (via `batch_user`) whose start
 * date is today or later (IST) — "Your course … will start on {date}". Sorted
 * soonest-first; deduped to one banner per batch. `[]` when none are upcoming.
 *
 * `batches.starting` is a DATE stored as IST wall-clock, so it's compared
 * against today's IST date and formatted from its parts directly.
 */
export async function getBatchStartBanners(
  userId: number,
  now: Date = new Date(),
): Promise<Array<BatchStartBanner>> {
  const istToday = getIstNowSqlDatetime(now).slice(0, 10) // YYYY-MM-DD (IST)

  const rows = normalizeRows<BatchStartRow>(
    await db.execute(sql`
      SELECT b.id AS batch_id, b.name AS batch_name, b.meta AS batch_meta, b.starting
      FROM batch_user bu
      JOIN batches b ON b.id = bu.batch_id
      WHERE bu.user_id = ${userId}
        AND bu.deleted_at IS NULL
        AND b.deleted_at IS NULL
        AND b.starting IS NOT NULL
        AND b.starting >= ${istToday}
      ORDER BY b.starting ASC
    `)
  )

  const seen = new Set<number>()
  const banners: Array<BatchStartBanner> = []
  for (const row of rows) {
    const batchId = Number(row.batch_id)
    if (seen.has(batchId) || typeof row.starting !== 'string') continue
    seen.add(batchId)
    const startDate = row.starting.slice(0, 10)
    banners.push({
      batchId,
      courseTitle: resolveCourseTitle(row.batch_meta, row.batch_name) || String(batchId),
      startDate,
      startDateLabel: formatStartDate(startDate),
    })
  }

  return banners
}
