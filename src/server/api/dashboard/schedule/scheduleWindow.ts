import { getIstDayWindow } from '@/server/time/istClock'

/** Inclusive IST date bounds `[today, today + days]` as `YYYY-MM-DD` strings. */
export interface ScheduleDateWindow {
  start: string
  end: string
}

/** Number of days shown on the dashboard schedule tab ("next 7 days"). */
const SCHEDULE_WINDOW_DAYS = 7

/**
 * One IST day of slack padded onto each side of the window. The client renders
 * the 7-day grid in the viewer's **local** timezone (see `buildScheduleWeek`),
 * which can be offset from IST calendar days by up to a day for a non-IST
 * viewer. Without this pad, items whose IST date sits just outside the IST
 * window but inside the viewer's local grid would never be fetched, leaving
 * holes. The client buckets by local day and drops anything off-grid, so the
 * extra rows are harmless.
 */
const WINDOW_TZ_PAD_DAYS = 1

/**
 * The date window the schedule tab filters on. Lectures/assignments are matched
 * when their `start_date` OR `end_date` falls in the window (IST). These are
 * `date` columns, so we compare against `YYYY-MM-DD` bounds. The nominal window
 * is `[today, today + 6]`, widened by {@link WINDOW_TZ_PAD_DAYS} on each side to
 * `[today - 1, today + 7]` so a non-IST viewer's local-day grid is fully covered.
 */
export function getScheduleDateWindow(
  now: Date = new Date(),
  days: number = SCHEDULE_WINDOW_DAYS,
): ScheduleDateWindow {
  // Shift back one day for the leading pad; extend daysAhead to cover today + 6
  // plus a day of pad on each end. Inclusive of today, so a 7-day grid is
  // today … today + 6.
  const paddedNow = new Date(now.getTime() - WINDOW_TZ_PAD_DAYS * 86_400_000)
  const daysAhead = days - 1 + 2 * WINDOW_TZ_PAD_DAYS
  const { start, end } = getIstDayWindow(paddedNow, daysAhead)
  return { start: start.slice(0, 10), end: end.slice(0, 10) }
}
