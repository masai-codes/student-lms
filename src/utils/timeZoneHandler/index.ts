import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

/** IST timezone constant — DB values are stored in this timezone. */
const IST = 'Asia/Kolkata'

/**
 * Parse a naive MySQL datetime string stored in IST.
 * Returns a dayjs Dayjs at the correct UTC moment.
 * Returns null when raw is falsy or unparseable.
 */
export function parseMysqlDatetimeIST(raw: string | null | undefined): dayjs.Dayjs | null {
  if (!raw) return null
  const stripped = raw
    .replace(' ', 'T')
    .replace(/Z$/, '')
    .replace(/[+-]\d{2}:\d{2}$/, '')
  const d = dayjs.tz(stripped, IST)
  return d.isValid() ? d : null
}

/**
 * Compute the adjusted "now" using a previously fetched server timestamp.
 * Adds elapsed device-side milliseconds so the value stays current between polls.
 */
export function getAdjustedNow(serverTimeISO: string, fetchedAt: number): dayjs.Dayjs {
  const elapsed = Date.now() - fetchedAt
  return dayjs(serverTimeISO).add(elapsed, 'millisecond')
}

// ── Display helpers (use device-local time — no IANA override) ────────────────

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** "7AM" or "7:30 AM" from a JS Date using device local time. */
function formatHourLocal(d: Date): string {
  const h = d.getHours() % 12 || 12
  const min = d.getMinutes()
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM'
  return min === 0 ? `${h}${ampm}` : `${h}:${pad(min)} ${ampm}`
}

/** "6 Jun" from a JS Date using device local time. */
function formatShortDateLocal(d: Date): string {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function isSameDayLocal(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

/**
 * Device local timezone abbreviation — e.g. "BST", "EDT", "IST".
 * Uses Intl without a timeZone override so it reflects whatever the device is set to.
 */
export function getTzLabel(): string {
  const now = new Date()
  const short = Intl.DateTimeFormat('en', { timeZoneName: 'short' })
    .formatToParts(now).find((p) => p.type === 'timeZoneName')?.value ?? ''
  if (short && !short.startsWith('GMT')) return short
  const long = Intl.DateTimeFormat('en', { timeZoneName: 'long' })
    .formatToParts(now).find((p) => p.type === 'timeZoneName')?.value ?? ''
  if (long && !long.startsWith('GMT')) {
    return long.split(' ').map((w) => w[0]?.toUpperCase() ?? '').join('')
  }
  return short
}

// ── Formatted strings for UI ──────────────────────────────────────────────────

/**
 * Format a time range matching what the user's device clock actually shows.
 *
 * skewMs = serverUTC_ms − deviceUTC_ms (captured at last server-time fetch).
 * Positive means device clock is behind actual UTC.
 * Subtracting skewMs from the event's UTC before calling getHours() ensures
 * the displayed time matches the reading on the user's (possibly wrong) clock.
 */
export function formatTimeRangeLocal(
  scheduleIST: string | null,
  concludesIST: string | null | undefined,
  skewMs = 0,
): string {
  const start = parseMysqlDatetimeIST(scheduleIST)
  if (!start) return ''
  const startDate = new Date(start.valueOf() - skewMs)
  const tzLabel = getTzLabel()

  const end = concludesIST ? parseMysqlDatetimeIST(concludesIST) : null
  if (!end) return `${formatHourLocal(startDate)} (${tzLabel})`

  const endDate = new Date(end.valueOf() - skewMs)
  if (isSameDayLocal(startDate, endDate)) {
    return `${formatHourLocal(startDate)} - ${formatHourLocal(endDate)} (${tzLabel})`
  }
  return `${formatShortDateLocal(startDate)}, ${formatHourLocal(startDate)} - ${formatShortDateLocal(endDate)}, ${formatHourLocal(endDate)} (${tzLabel})`
}

// ── IST formatting helpers (used internally for IST-pinned display) ───────────

function formatHourIST(d: dayjs.Dayjs): string {
  const h = d.hour() % 12 || 12
  const min = d.minute()
  const ampm = d.hour() >= 12 ? 'PM' : 'AM'
  return min === 0 ? `${h}${ampm}` : `${h}:${pad(min)} ${ampm}`
}

function formatShortDateIST(d: dayjs.Dayjs): string {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${d.date()} ${MONTHS[d.month()]}`
}

/**
 * Format a time range always in IST — used in tooltips.
 * e.g. "5:13 PM - 6:12 PM (IST)"
 */
export function formatTimeRangeIST(
  scheduleIST: string | null,
  concludesIST: string | null | undefined,
): string {
  const start = parseMysqlDatetimeIST(scheduleIST)
  if (!start) return ''
  const end = concludesIST ? parseMysqlDatetimeIST(concludesIST) : null
  if (!end) return `${formatHourIST(start)} (IST)`
  if (start.isSame(end, 'day')) {
    return `${formatHourIST(start)} - ${formatHourIST(end)} (IST)`
  }
  return `${formatShortDateIST(start)}, ${formatHourIST(start)} - ${formatShortDateIST(end)}, ${formatHourIST(end)} (IST)`
}

/**
 * Format a single timestamp matching what the user's device clock shows.
 * skewMs: see formatTimeRangeLocal.
 */
export function formatTimestampLocal(raw: string, skewMs = 0): string {
  const d = parseMysqlDatetimeIST(raw)
  if (!d) return ''
  const date = new Date(d.valueOf() - skewMs)
  return `${formatShortDateLocal(date)}, ${formatHourLocal(date)} (${getTzLabel()})`
}

/**
 * Format a single timestamp always in IST.
 * e.g. "6 Jun, 9:54 AM (IST)"
 */
export function formatTimestampIST(raw: string): string {
  const d = parseMysqlDatetimeIST(raw)
  if (!d) return ''
  return `${formatShortDateIST(d)}, ${formatHourIST(d)} (IST)`
}

// ── Date-key helpers (use server time + device local timezone) ────────────────

/**
 * "YYYY-MM-DD" date key for today using server-adjusted time and device local timezone.
 */
export function getTodayDateKeyTz(now: dayjs.Dayjs): string {
  const d = new Date(now.valueOf())
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Rolling 7-day window starting from today (server time, device local timezone).
 */
export function getWeekWindowTz(now: dayjs.Dayjs): { weekStart: dayjs.Dayjs; weekEnd: dayjs.Dayjs } {
  const local = dayjs(now.valueOf()).startOf('day')
  return { weekStart: local, weekEnd: local.add(6, 'day') }
}
