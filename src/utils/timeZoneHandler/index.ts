import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

/** IST timezone constant — DB values are stored in this timezone. */
const IST = 'Asia/Kolkata'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

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

// ── Local timezone helpers (dayjs local mode) ─────────────────────────────────

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/**
 * Convert any dayjs moment to a local-mode dayjs (device timezone).
 * dayjs(timestamp) interprets the epoch in the device's local timezone.
 */
function toLocalDayjs(d: dayjs.Dayjs): dayjs.Dayjs {
  return dayjs(d.valueOf())
}

/** "7AM" or "7:30 AM" from a local-mode dayjs. */
function formatHourLocal(d: dayjs.Dayjs): string {
  const h = d.hour() % 12 || 12
  const min = d.minute()
  const ampm = d.hour() >= 12 ? 'PM' : 'AM'
  return min === 0 ? `${h}${ampm}` : `${h}:${pad(min)} ${ampm}`
}

/** "6 Jun" from a local-mode dayjs. */
function formatShortDateLocal(d: dayjs.Dayjs): string {
  return `${d.date()} ${MONTHS[d.month()]}`
}

/**
 * Device timezone abbreviation — e.g. "BST", "EDT", "IST".
 * Uses Intl since dayjs doesn't expose an abbreviated timezone name.
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
 * Format a time range in the user's device-local timezone.
 * IST DB values are parsed to the correct UTC moment, then displayed in local time.
 */
export function formatTimeRangeLocal(
  scheduleIST: string | null,
  concludesIST: string | null | undefined,
): string {
  const start = parseMysqlDatetimeIST(scheduleIST)
  if (!start) return ''
  const startLocal = toLocalDayjs(start)
  const tzLabel = getTzLabel()

  const end = concludesIST ? parseMysqlDatetimeIST(concludesIST) : null
  if (!end) return `${formatHourLocal(startLocal)} (${tzLabel})`

  const endLocal = toLocalDayjs(end)
  if (startLocal.isSame(endLocal, 'day')) {
    return `${formatHourLocal(startLocal)} - ${formatHourLocal(endLocal)} (${tzLabel})`
  }
  return `${formatShortDateLocal(startLocal)}, ${formatHourLocal(startLocal)} - ${formatShortDateLocal(endLocal)}, ${formatHourLocal(endLocal)} (${tzLabel})`
}

// ── IST formatting helpers ────────────────────────────────────────────────────

function formatHourIST(d: dayjs.Dayjs): string {
  const h = d.hour() % 12 || 12
  const min = d.minute()
  const ampm = d.hour() >= 12 ? 'PM' : 'AM'
  return min === 0 ? `${h}${ampm}` : `${h}:${pad(min)} ${ampm}`
}

function formatShortDateIST(d: dayjs.Dayjs): string {
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
 * Format a single timestamp in the user's device-local timezone.
 */
export function formatTimestampLocal(raw: string): string {
  const d = parseMysqlDatetimeIST(raw)
  if (!d) return ''
  const local = toLocalDayjs(d)
  return `${formatShortDateLocal(local)}, ${formatHourLocal(local)} (${getTzLabel()})`
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

// ── Date-key helpers ──────────────────────────────────────────────────────────

/**
 * "YYYY-MM-DD" date key for today using server-adjusted time and device local timezone.
 */
export function getTodayDateKeyTz(now: dayjs.Dayjs): string {
  const local = dayjs(now.valueOf())
  return `${local.year()}-${pad(local.month() + 1)}-${pad(local.date())}`
}

/**
 * Rolling 7-day window starting from today (server time, device local timezone).
 */
export function getWeekWindowTz(now: dayjs.Dayjs): { weekStart: dayjs.Dayjs; weekEnd: dayjs.Dayjs } {
  const local = dayjs(now.valueOf()).startOf('day')
  return { weekStart: local, weekEnd: local.add(6, 'day') }
}
