import { and, asc, eq, gte, isNull, lte } from 'drizzle-orm'
import { resolveSupportSessionStatus } from './supportSessionStatus'
import type { SupportSessionStatus } from './supportSessionStatus'
import { db } from '@/db'
import { lectures } from '@/db/schema'
import { getIstDayWindow } from '@/server/time/istClock'

/** Single hardcoded section holding all help / support-session lectures. */
const HELP_SESSION_SECTION_ID = 7576
/** Window is "today" through end of the 8th day out. */
const SUPPORT_SESSION_WINDOW_DAYS = 8

/** An upcoming help session, with all presentation state pre-computed. */
export interface DashboardSupportSession {
  id: number
  title: string
  /** IST ISO-8601 (`…+05:30`). */
  schedule: string | null
  /** IST ISO-8601 (`…+05:30`). */
  concludes: string | null
  zoomLink: string | null
  status: SupportSessionStatus
}

/**
 * Upcoming help sessions for the next ~8 days, soonest-first. All logic is on
 * the backend — the window, IST formatting, and the live/today/upcoming status
 * — so the frontend only renders.
 *
 * Rows are `lectures` in the help-session section, scheduled between the start
 * of today and the end of the 8th day out, and not deleted.
 */
export async function getSupportSessions(
  now: Date = new Date(),
): Promise<Array<DashboardSupportSession>> {
  const { start, end } = getIstDayWindow(now, SUPPORT_SESSION_WINDOW_DAYS)

  const rows = await db
    .select({
      id: lectures.id,
      title: lectures.title,
      schedule: lectures.schedule,
      concludes: lectures.concludes,
      zoomLink: lectures.zoomLink,
    })
    .from(lectures)
    .where(
      and(
        eq(lectures.sectionId, HELP_SESSION_SECTION_ID),
        gte(lectures.schedule, start),
        lte(lectures.schedule, end),
        isNull(lectures.deletedAt),
      ),
    )
    .orderBy(asc(lectures.schedule))

  // `schedule`/`concludes` already arrive as offset-stamped IST ISO strings
  // (`…+05:30`) from the `istDatetime` column type — pass them through as-is;
  // re-formatting here would double the offset and produce an invalid date.
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    schedule: row.schedule,
    concludes: row.concludes,
    zoomLink: row.zoomLink,
    status: resolveSupportSessionStatus(row.schedule, row.concludes, now),
  }))
}
