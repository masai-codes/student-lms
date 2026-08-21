import { and, gte, isNull, lte, or } from 'drizzle-orm'
import type { AnyColumn, SQL } from 'drizzle-orm'
import type { CalendarWindow } from './calendarWindow'

/**
 * True-overlap window predicate shared by the three calendar fetchers.
 *
 * A row matches when its `[start_date, end_date]` span intersects the window —
 * unlike the dashboard's "either endpoint in window" filter, this also catches
 * events that span the entire visible range (the old LMS missed those). Rows
 * with a null `end_date` fall back to `start_date`; rows with a null
 * `start_date` fall back to the `schedule` datetime so a scheduled event can
 * never be lost to an unset date column.
 */
export function calendarOverlapClause(
  cols: { startDate: AnyColumn; endDate: AnyColumn; schedule: AnyColumn },
  window: CalendarWindow,
): SQL | undefined {
  return or(
    and(
      lte(cols.startDate, window.end),
      or(
        gte(cols.endDate, window.start),
        and(isNull(cols.endDate), gte(cols.startDate, window.start)),
      ),
    ),
    and(
      isNull(cols.startDate),
      gte(cols.schedule, `${window.start} 00:00:00`),
      lte(cols.schedule, `${window.end} 23:59:59`),
    ),
  )
}
