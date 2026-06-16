/**
 * Date/time formatting for the event detail page, all in the viewer's own
 * timezone (their device timezone) to match the rest of Masaiverse (see
 * `masaiverseEventCard.ts`), so each learner sees the event time on their own
 * clock with a timezone label. Inputs are UTC ISO strings; the helpers return
 * `null` when a timestamp is missing or unparseable so callers can fall back
 * gracefully.
 *
 * `skewMs` comes from {@link useServerTime} (server UTC − device UTC). It is
 * subtracted from the instant before formatting so the displayed wall-clock
 * matches the reading on the user's (possibly wrong) device clock — the same
 * convention `formatTimestampLocal` uses.
 */
import { getTzLabel } from '@/utils/timeZoneHandler'

function toDate(value: string | null, skewMs = 0): Date | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Date(date.getTime() - skewMs)
}

function formatLocalTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

/** Short date, e.g. "Wed, 10 Jun 2026" — used for compact multi-day lines. */
function formatLocalShortDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/** "Wed, 10 Jun 2026, 9:00 AM" — a full instant for multi-day events. */
function formatLocalDateTime(date: Date): string {
  return `${formatLocalShortDate(date)}, ${formatLocalTime(date)}`
}

/** The viewer-local calendar day ("2026-06-10") an instant falls on, for comparison. */
function localDayKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export interface EventDateBadge {
  /** Uppercase short month, e.g. "JUN". */
  month: string
  /** Day of month, e.g. "15". */
  day: string
}

/** Calendar-block badge ({ month, day }) from the start (or end) instant. */
export function formatLocalDateBadge(
  startTime: string | null,
  endTime: string | null,
  skewMs = 0,
): EventDateBadge | null {
  const date = toDate(startTime, skewMs) ?? toDate(endTime, skewMs)
  if (!date) return null
  const month = new Intl.DateTimeFormat('en-US', {
    month: 'short',
  })
    .format(date)
    .toUpperCase()
  const day = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
  }).format(date)
  return { month, day }
}

/** Long date line, e.g. "Saturday, 15 June 2026". Null when no start/end. */
export function formatLocalLongDate(
  startTime: string | null,
  endTime: string | null,
  skewMs = 0,
): string | null {
  const date = toDate(startTime, skewMs) ?? toDate(endTime, skewMs)
  if (!date) return null
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/**
 * Time line in the viewer's timezone. Returns a range ("2:00 PM – 5:00 PM")
 * when both timestamps are present, a single time when only one is, and `null`
 * when neither is. The timezone label is added by the caller.
 */
export function formatLocalTimeRange(
  startTime: string | null,
  endTime: string | null,
  skewMs = 0,
): string | null {
  const start = toDate(startTime, skewMs)
  const end = toDate(endTime, skewMs)
  if (start && end) return `${formatLocalTime(start)} – ${formatLocalTime(end)}`
  if (start) return formatLocalTime(start)
  if (end) return `Ends ${formatLocalTime(end)}`
  return null
}

/** Two display lines for the event "when" row: a bold date line and a muted
 * time line (which already carries the timezone label). Either can be `null`. */
export interface EventSchedule {
  dateLine: string | null
  timeLine: string | null
}

/**
 * Builds the date/time lines for the detail page's "when" row. Single-day
 * events keep the long date + time-range layout. Multi-day events instead show
 * the full start instant on the date line and the full end instant on the time
 * line ("to Fri, 12 Jun 2026, 11:30 AM (IST)"), so both dates are unambiguous.
 */
export function formatLocalSchedule(
  startTime: string | null,
  endTime: string | null,
  skewMs = 0,
): EventSchedule {
  const start = toDate(startTime, skewMs)
  const end = toDate(endTime, skewMs)
  const tzLabel = getTzLabel()

  const isMultiDay =
    start != null && end != null && localDayKey(start) !== localDayKey(end)

  if (isMultiDay) {
    return {
      dateLine: formatLocalDateTime(start),
      timeLine: `to ${formatLocalDateTime(end)} (${tzLabel})`,
    }
  }

  const range = formatLocalTimeRange(startTime, endTime, skewMs)
  return {
    dateLine: formatLocalLongDate(startTime, endTime, skewMs),
    timeLine: range ? `${range} (${tzLabel})` : null,
  }
}
