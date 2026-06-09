/**
 * Calendar range helpers for "this week" / "this year" style metrics.
 *
 * Timestamps are stored in the DB as UTC, but our users are in India, so the
 * boundaries that feel natural to them ("this week", "this year") must be
 * computed in IST and then converted back to UTC instants for querying.
 *
 * India has no DST, so IST is a fixed +05:30 offset — we can shift by a constant
 * rather than pulling in a timezone library.
 */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

export interface DateRange {
  /** Inclusive lower bound, as a UTC instant. */
  start: Date
  /** Exclusive upper bound, as a UTC instant. */
  end: Date
}

/** Reads the IST wall-clock parts (year/month/day/weekday) of a UTC instant. */
function toIstParts(instant: Date) {
  const ist = new Date(instant.getTime() + IST_OFFSET_MS)
  return {
    year: ist.getUTCFullYear(),
    month: ist.getUTCMonth(),
    day: ist.getUTCDate(),
    // 0 = Sunday … 6 = Saturday, in IST wall-clock terms.
    weekday: ist.getUTCDay(),
  }
}

/** UTC instant of 00:00 IST on the given IST calendar date. */
function istMidnightToUtc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - IST_OFFSET_MS)
}

/**
 * Current IST calendar week, Monday 00:00 (inclusive) → next Monday 00:00
 * (exclusive). Monday-start follows ISO-8601 and the Indian convention.
 */
export function getCurrentWeekRangeIst(now: Date): DateRange {
  const { year, month, day, weekday } = toIstParts(now)
  // Distance back to Monday: Mon→0, Tue→1, … Sun→6.
  const daysFromMonday = (weekday + 6) % 7
  const start = istMidnightToUtc(year, month, day - daysFromMonday)
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
  return { start, end }
}

/**
 * Previous IST calendar week — the seven days immediately before the current
 * week (Monday 00:00 inclusive → this week's Monday 00:00 exclusive).
 */
export function getLastWeekRangeIst(now: Date): DateRange {
  const thisWeek = getCurrentWeekRangeIst(now)
  return {
    start: new Date(thisWeek.start.getTime() - 7 * 24 * 60 * 60 * 1000),
    end: thisWeek.start,
  }
}

/**
 * Current IST calendar month, the 1st 00:00 (inclusive) → next month's 1st
 * 00:00 (exclusive).
 */
export function getCurrentMonthRangeIst(now: Date): DateRange {
  const { year, month } = toIstParts(now)
  return {
    start: istMidnightToUtc(year, month, 1),
    end: istMidnightToUtc(year, month + 1, 1),
  }
}

/**
 * Current IST calendar year, Jan 1 00:00 (inclusive) → next Jan 1 00:00
 * (exclusive).
 */
export function getCurrentYearRangeIst(now: Date): DateRange {
  const { year } = toIstParts(now)
  return {
    start: istMidnightToUtc(year, 0, 1),
    end: istMidnightToUtc(year + 1, 0, 1),
  }
}

/** Formats a UTC instant as a `YYYY-MM-DD HH:MM:SS` string for SQL comparisons. */
export function toMysqlUtc(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}
