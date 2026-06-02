import { and, count, gte, lt } from 'drizzle-orm'
import { db } from '@/db'
import { events } from '@/db/schema'
import { getCurrentYearRangeIst, toMysqlUtc } from '@/lib/dateRanges'

/**
 * Total events scheduled in the current IST year — both public events
 * (no `clubId`) and club events — keyed off `start_time`. Events without a
 * start time are excluded since they can't be placed in a year.
 */
export async function getEventsThisYearCount(now: Date): Promise<number> {
  const { start, end } = getCurrentYearRangeIst(now)

  const rows = await db
    .select({ count: count() })
    .from(events)
    .where(
      and(
        gte(events.startTime, toMysqlUtc(start)),
        lt(events.startTime, toMysqlUtc(end)),
      ),
    )

  return rows.at(0)?.count ?? 0
}
