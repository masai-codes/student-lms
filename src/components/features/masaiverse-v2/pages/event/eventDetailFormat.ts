/**
 * Date/time formatting for the event detail page, all in IST to match the rest
 * of Masaiverse (see `masaiverseEventCard.ts`). Inputs are UTC ISO strings; the
 * helpers return `null` when a timestamp is missing or unparseable so callers
 * can fall back gracefully.
 */
const IST_TIME_ZONE = 'Asia/Kolkata'

function toDate(value: string | null): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatIstTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

/** Short date, e.g. "Wed, 10 Jun 2026" — used for compact multi-day lines. */
function formatIstShortDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/** "Wed, 10 Jun 2026, 9:00 AM" — a full instant for multi-day events. */
function formatIstDateTime(date: Date): string {
  return `${formatIstShortDate(date)}, ${formatIstTime(date)}`
}

/** The IST calendar day ("2026-06-10") two instants fall on, for comparison. */
function istDayKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIME_ZONE,
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
export function formatIstDateBadge(
  startTime: string | null,
  endTime: string | null,
): EventDateBadge | null {
  const date = toDate(startTime) ?? toDate(endTime)
  if (!date) return null
  const month = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIME_ZONE,
    month: 'short',
  })
    .format(date)
    .toUpperCase()
  const day = new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIME_ZONE,
    day: 'numeric',
  }).format(date)
  return { month, day }
}

/** Long date line, e.g. "Saturday, 15 June 2026". Null when no start/end. */
export function formatIstLongDate(
  startTime: string | null,
  endTime: string | null,
): string | null {
  const date = toDate(startTime) ?? toDate(endTime)
  if (!date) return null
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/**
 * Time line in IST. Returns a range ("2:00 PM – 5:00 PM") when both timestamps
 * are present, a single time when only one is, and `null` when neither is.
 */
export function formatIstTimeRange(
  startTime: string | null,
  endTime: string | null,
): string | null {
  const start = toDate(startTime)
  const end = toDate(endTime)
  if (start && end) return `${formatIstTime(start)} – ${formatIstTime(end)}`
  if (start) return formatIstTime(start)
  if (end) return `Ends ${formatIstTime(end)}`
  return null
}

/** Two display lines for the event "when" row: a bold date line and a muted
 * time line (which already carries the "IST" suffix). Either can be `null`. */
export interface EventSchedule {
  dateLine: string | null
  timeLine: string | null
}

/**
 * Builds the date/time lines for the detail page's "when" row. Single-day
 * events keep the long date + time-range layout. Multi-day events instead show
 * the full start instant on the date line and the full end instant on the time
 * line ("to Fri, 12 Jun 2026, 11:30 AM IST"), so both dates are unambiguous.
 */
export function formatIstSchedule(
  startTime: string | null,
  endTime: string | null,
): EventSchedule {
  const start = toDate(startTime)
  const end = toDate(endTime)

  const isMultiDay =
    start != null && end != null && istDayKey(start) !== istDayKey(end)

  if (isMultiDay) {
    return {
      dateLine: formatIstDateTime(start),
      timeLine: `to ${formatIstDateTime(end)} IST`,
    }
  }

  const range = formatIstTimeRange(startTime, endTime)
  return {
    dateLine: formatIstLongDate(startTime, endTime),
    timeLine: range ? `${range} IST` : null,
  }
}
