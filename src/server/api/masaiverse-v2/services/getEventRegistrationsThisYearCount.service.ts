import { and, count, gte, lt } from 'drizzle-orm'
import { db } from '@/db'
import { eventEnrollments } from '@/db/schema'
import { getCurrentYearRangeIst, toMysqlUtc } from '@/lib/dateRanges'

/**
 * Total event registrations made in the current IST year, keyed off
 * `enrolled_at` (when the learner registered, not when the event runs).
 */
export async function getEventRegistrationsThisYearCount(
  now: Date,
): Promise<number> {
  const { start, end } = getCurrentYearRangeIst(now)

  const rows = await db
    .select({ count: count() })
    .from(eventEnrollments)
    .where(
      and(
        gte(eventEnrollments.enrolledAt, toMysqlUtc(start)),
        lt(eventEnrollments.enrolledAt, toMysqlUtc(end)),
      ),
    )

  return rows.at(0)?.count ?? 0
}
