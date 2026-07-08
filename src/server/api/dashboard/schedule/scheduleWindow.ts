import { getIstDayWindow } from '@/server/time/istClock'

/** Inclusive IST date bounds `[today, today + days]` as `YYYY-MM-DD` strings. */
export interface ScheduleDateWindow {
  start: string
  end: string
}

/** Number of days shown on the dashboard schedule tab ("next 7 days"). */
export const SCHEDULE_WINDOW_DAYS = 7

/**
 * The date window the schedule tab filters on. Lectures/assignments are matched
 * when their `start_date` OR `end_date` falls in `[today, today + 7]` (IST).
 * These are `date` columns, so we compare against `YYYY-MM-DD` bounds.
 */
export function getScheduleDateWindow(
  now: Date = new Date(),
  days: number = SCHEDULE_WINDOW_DAYS,
): ScheduleDateWindow {
  // Inclusive of today, so a 7-day window is today … today + 6.
  const { start, end } = getIstDayWindow(now, days - 1)
  return { start: start.slice(0, 10), end: end.slice(0, 10) }
}
