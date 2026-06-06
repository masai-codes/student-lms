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
