import { ApiError } from '@/server/api/http/apiError'

/** Inclusive `YYYY-MM-DD` bounds of the client's visible grid. */
export interface CalendarWindow {
  start: string
  end: string
}

/**
 * Longest requestable window. A month view is a 42-cell grid (6 weeks); 45
 * leaves room for that plus timezone padding while still rejecting
 * unbounded scans.
 */
export const MAX_CALENDAR_WINDOW_DAYS = 45

/** End-of-event fallbacks when `concludes` is null (parity with the old LMS). */
export const LECTURE_FALLBACK_MS = 60 * 60 * 1000
export const ASSIGNMENT_FALLBACK_MS = 24 * 60 * 60 * 1000
export const QUIZ_FALLBACK_MS = 2 * 60 * 60 * 1000

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const DAY_MS = 86_400_000

function parseDateParam(value: unknown, name: string): string {
  if (typeof value !== 'string' || !DATE_RE.test(value)) {
    throw invalidRange(`Invalid ${name} date`)
  }
  const ms = Date.parse(`${value}T00:00:00Z`)
  // Reject well-formed but impossible dates (e.g. 2026-02-31 rolls over).
  if (
    !Number.isFinite(ms) ||
    new Date(ms).toISOString().slice(0, 10) !== value
  ) {
    throw invalidRange(`Invalid ${name} date`)
  }
  return value
}

function dateToUtcMs(date: string): number {
  return Date.parse(`${date}T00:00:00Z`)
}

function shiftDate(date: string, days: number): string {
  return new Date(dateToUtcMs(date) + days * DAY_MS).toISOString().slice(0, 10)
}

/**
 * Validates the client-supplied visible range: both bounds present and
 * well-formed, ordered, and spanning at most {@link MAX_CALENDAR_WINDOW_DAYS}.
 * Throws `ApiError(400, 'INVALID_CALENDAR_RANGE')` otherwise.
 */
export function parseCalendarWindow(
  start: unknown,
  end: unknown,
): CalendarWindow {
  const parsedStart = parseDateParam(start, 'start')
  const parsedEnd = parseDateParam(end, 'end')

  const spanDays =
    (dateToUtcMs(parsedEnd) - dateToUtcMs(parsedStart)) / DAY_MS + 1
  if (spanDays < 1 || spanDays > MAX_CALENDAR_WINDOW_DAYS) {
    throw invalidRange('Range out of bounds')
  }

  return { start: parsedStart, end: parsedEnd }
}

/** 400 whose message keeps the stable code (the detail travels separately). */
function invalidRange(detail: string): ApiError {
  return new ApiError(
    400,
    'INVALID_CALENDAR_RANGE',
    `INVALID_CALENDAR_RANGE: ${detail}`,
  )
}

/**
 * One day of slack on each side. The client's grid is in the viewer's local
 * timezone while the DB date columns are IST — an event can sit one IST
 * calendar day outside the local grid and still belong on it. The client
 * buckets by local day and drops off-grid rows, so extra rows are harmless.
 */
const CALENDAR_TZ_PAD_DAYS = 1

/** The window actually sent to SQL — visible range widened by the TZ pad. */
export function padCalendarWindow(window: CalendarWindow): CalendarWindow {
  return {
    start: shiftDate(window.start, -CALENDAR_TZ_PAD_DAYS),
    end: shiftDate(window.end, CALENDAR_TZ_PAD_DAYS),
  }
}
