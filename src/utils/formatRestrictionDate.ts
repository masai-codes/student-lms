const IST = 'Asia/Kolkata'

function formatDayMonthYear(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/**
 * Formats a `batch_user.meta` restriction date (enrolment cancelled / paused /
 * agreement banned) as e.g. `1 Jul 2026`.
 *
 * The shape varies by writer: a bare IST wall-clock date (`"2026-07-01"`,
 * `"2026-07-01 00:00:00"`) or a full UTC instant
 * (`"2026-07-25T13:38:18.991Z"`). Wall-clock dates are read straight off the
 * string and rendered in UTC so the viewer's timezone can't shift the day;
 * instants are rendered on the IST calendar, which is the calendar the admin
 * who cancelled the enrolment was looking at.
 *
 * Returns `null` for empty or unparseable input so callers can omit the date
 * rather than render "Invalid Date".
 */
export function formatRestrictionDate(
  value: string | null | undefined,
): string | null {
  const raw = value?.trim()
  if (!raw) return null

  const wallClock = /^(\d{4})-(\d{2})-(\d{2})(?: |$)/.exec(raw)
  if (wallClock) {
    const [, year, month, day] = wallClock
    return formatDayMonthYear(
      new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))),
      'UTC',
    )
  }

  const instant = new Date(raw)
  if (Number.isNaN(instant.getTime())) return null
  return formatDayMonthYear(instant, IST)
}
