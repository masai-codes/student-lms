/**
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │  Timezone handling — the single app-side home for reading & displaying     │
 * │  the datetimes we get back from the API/DB.                                │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * WHERE VALUES COME FROM
 *   The DB layer (`src/db/columnTypes.ts`) stamps every time column on read:
 *     • `DATETIME`  → IST wall-clock → "...+05:30"
 *     • `TIMESTAMP` → UTC instant    → "...Z"
 *   So most modern reads arrive offset-stamped and `dayjs(value)` "just works".
 *   The parsers below additionally cope with LEGACY naive strings (no offset)
 *   that predate that layer, by interpreting them in the column's known zone.
 *
 * WHAT THIS FILE PROVIDES  (nothing else in the app should re-implement these)
 *   1. Parsers   — turn a DB/API string into a correct absolute instant.
 *   2. Zone info — describe the *viewer's* device timezone (label / is-IST).
 *   3. Formatters — render an instant either in the viewer's local zone
 *                   (`…Local`) or forced to IST (`…IST`, used for tooltips).
 *
 * DESIGN NOTES
 *   • dayjs is the ONLY datetime dependency (utc + timezone plugins). We do not
 *     hand-roll month tables, zero-padding or AM/PM — dayjs `.format()` does it.
 *   • The `…Local` / `…IST` formatter pairs share the SAME `formatHour` /
 *     `formatDate` helpers; they differ only in the dayjs they are handed
 *     (device-local vs IST) and the trailing label.
 */

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

/** IST timezone. `DATETIME` columns store wall-clock in this zone (no DST). */
const IST = 'Asia/Kolkata'

// ── 1. Parsers ────────────────────────────────────────────────────────────────

/** Matches a trailing zone marker: `Z`, `+05:30`, `-0400`, etc. */
const ZONE_SUFFIX_REGEX = /(Z|[+-]\d{2}(?::?\d{2})?)$/i
/** Matches a naive `YYYY-MM-DD HH:MM:SS[.fff]` datetime with no zone. */
const NAIVE_DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/

type FutureFallback = {
  /** "now" the future check is measured against (epoch ms). */
  nowMs: number
  /** How far past `nowMs` a UTC read may land before we distrust it (ms). */
  skewMs: number
}

/**
 * Core parser for columns whose naive strings mean **UTC**. Shared by
 * `parseServerTimestamp` and `parseMasaiverseEventDbTimestamp` so the
 * zone-suffix / naive-datetime handling lives in exactly one place.
 *
 *   • A value WITH a zone suffix (or ISO `Z`/offset) is already unambiguous.
 *   • A naive value is read as UTC.
 *   • `futureFallback` (optional): if the UTC reading lands suspiciously far in
 *     the future, re-read the value in the host's LOCAL zone instead. This is a
 *     safety net for dev/staging DBs mistakenly configured to store local time;
 *     omit it for prod columns you KNOW are UTC (a genuine future timestamp must
 *     stay UTC, not be silently shifted).
 */
function parseUtcDbInstant(
  value: string | null | undefined,
  futureFallback?: FutureFallback,
): Date | null {
  const raw = value?.trim()
  if (!raw) return null

  if (ZONE_SUFFIX_REGEX.test(raw)) {
    const d = new Date(raw)
    return Number.isNaN(d.getTime()) ? null : d
  }

  if (NAIVE_DATETIME_REGEX.test(raw)) {
    const normalized = raw.replace(' ', 'T')
    const asUtc = new Date(`${normalized}Z`)
    if (Number.isNaN(asUtc.getTime())) return null
    if (futureFallback && asUtc.getTime() > futureFallback.nowMs + futureFallback.skewMs) {
      const asLocal = new Date(normalized)
      return Number.isNaN(asLocal.getTime()) ? null : asLocal
    }
    return asUtc
  }

  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Parse a naive MySQL datetime stored in **IST** (i.e. a `DATETIME` column).
 * Returns a dayjs at the correct UTC moment (in IST mode), or null.
 * Any pre-existing zone suffix is stripped first, so both legacy naive strings
 * and the offset-stamped strings the DB layer now emits resolve identically.
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
 * Parse a **UTC** server timestamp, tolerating dev DBs on local time.
 * Naive strings are read as UTC unless that lands more than `futureSkewMs`
 * (default 1h) ahead of `nowMs`, in which case we fall back to local parsing.
 * Used for social/relative-time where a wrong-by-5.5h value is very visible.
 */
export function parseServerTimestamp(
  value: string | null | undefined,
  options: { futureSkewMs?: number; nowMs?: number } = {},
): Date | null {
  return parseUtcDbInstant(value, {
    nowMs: options.nowMs ?? Date.now(),
    skewMs: options.futureSkewMs ?? 60 * 60 * 1000,
  })
}

/**
 * Parse a Masaiverse event's **UTC** timestamp (`events.start_time`/`end_time`).
 * STRICT UTC — no future fallback: events are legitimately in the future, so a
 * fallback would misread them (e.g. show 08:30 instead of 14:00 IST).
 */
export function parseMasaiverseEventDbTimestamp(value: string | null | undefined): Date | null {
  return parseUtcDbInstant(value)
}

/**
 * Server-anchored "now": add the ms elapsed on the device since a server
 * timestamp was fetched, so countdowns stay correct even if the device clock is
 * skewed. `serverTimeISO` should be an offset-stamped/ISO string.
 */
export function getAdjustedNow(serverTimeISO: string, fetchedAt: number): dayjs.Dayjs {
  const elapsed = Date.now() - fetchedAt
  return dayjs(serverTimeISO).add(elapsed, 'millisecond')
}

// ── 2. Viewer (device) timezone info ────────────────────────────────────────────

/**
 * Whether the viewer's device is effectively at the IST offset (UTC+5:30).
 * When true, local rendering already equals IST rendering, so no IST tooltip is
 * needed. `getTimezoneOffset()` is minutes behind UTC (negative when ahead), so
 * IST is `-330`. Any +5:30 zone (e.g. Colombo) counts, since the clock reads the
 * same. Must run client-side.
 */
export function isIstTimezone(): boolean {
  return new Date().getTimezoneOffset() === -330
}

/**
 * Viewer's timezone abbreviation — "BST", "EDT", "IST", … Uses `Intl` because
 * dayjs has no abbreviated zone name. Falls back to initials of the long name
 * when only a "GMT+X" form is available (e.g. Kolkata → "India Standard Time" →
 * "IST"). Must run client-side.
 */
export function getTzLabel(): string {
  const now = new Date()
  const short =
    Intl.DateTimeFormat('en', { timeZoneName: 'short' })
      .formatToParts(now)
      .find((p) => p.type === 'timeZoneName')?.value ?? ''
  if (short && !short.startsWith('GMT')) return short
  const long =
    Intl.DateTimeFormat('en', { timeZoneName: 'long' })
      .formatToParts(now)
      .find((p) => p.type === 'timeZoneName')?.value ?? ''
  if (long && !long.startsWith('GMT')) {
    return long
      .split(' ')
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('')
  }
  return short
}

// ── 3. Formatting helpers (shared by every formatter below) ─────────────────────

/** Same instant, re-expressed in the viewer's device-local zone. */
function toLocal(d: dayjs.Dayjs): dayjs.Dayjs {
  return d.local()
}

/** "7AM" on the hour, else "7:30 AM". Zone follows whatever `d` is in. */
function formatHour(d: dayjs.Dayjs): string {
  return d.minute() === 0 ? d.format('hA') : d.format('h:mm A')
}

/** "6 Jun" (withYear=false) or "6 Jun 2026" (withYear=true). */
function formatDate(d: dayjs.Dayjs, withYear: boolean): string {
  return d.format(withYear ? 'D MMM YYYY' : 'D MMM')
}

// ── 3a. Schedule ranges (leading date, no year) ─────────────────────────────────

/** Local schedule range, e.g. "2 Jul, 6:30 PM - 7:30 PM (IST)". */
export function formatScheduleRangeLocal(
  scheduleIST: string | null,
  concludesIST: string | null | undefined,
): string {
  const start = parseMysqlDatetimeIST(scheduleIST)
  if (!start) return ''
  const startLocal = toLocal(start)
  const tz = getTzLabel()
  const end = concludesIST ? parseMysqlDatetimeIST(concludesIST) : null
  const startLabel = `${formatDate(startLocal, false)}, ${formatHour(startLocal)}`
  if (!end) return `${startLabel} (${tz})`
  const endLocal = toLocal(end)
  if (startLocal.isSame(endLocal, 'day')) {
    return `${startLabel} - ${formatHour(endLocal)} (${tz})`
  }
  return `${startLabel} - ${formatDate(endLocal, false)}, ${formatHour(endLocal)} (${tz})`
}

/** Same as {@link formatScheduleRangeLocal} but always IST — for tooltips. */
export function formatScheduleRangeIST(
  scheduleIST: string | null,
  concludesIST: string | null | undefined,
): string {
  const start = parseMysqlDatetimeIST(scheduleIST)
  if (!start) return ''
  const end = concludesIST ? parseMysqlDatetimeIST(concludesIST) : null
  const startLabel = `${formatDate(start, false)}, ${formatHour(start)}`
  if (!end) return `${startLabel} (IST)`
  if (start.isSame(end, 'day')) {
    return `${startLabel} - ${formatHour(end)} (IST)`
  }
  return `${startLabel} - ${formatDate(end, false)}, ${formatHour(end)} (IST)`
}

/**
 * Full lecture range for a detail page: local date+time WITH the year and a tz
 * label, e.g. "10 May 2026, 3:30 PM - 5:30 PM (IST)". Localized counterpart of
 * the server-side IST-only formatter. Must run client-side.
 */
export function formatLectureRangeLocal(
  scheduleIST: string | null,
  concludesIST: string | null | undefined,
): string {
  const start = parseMysqlDatetimeIST(scheduleIST)
  if (!start) return ''
  const startLocal = toLocal(start)
  const tz = getTzLabel()
  const end = concludesIST ? parseMysqlDatetimeIST(concludesIST) : null
  const startLabel = `${formatDate(startLocal, true)}, ${formatHour(startLocal)}`
  if (!end) return `${startLabel} (${tz})`
  const endLocal = toLocal(end)
  if (startLocal.isSame(endLocal, 'day')) {
    return `${startLabel} - ${formatHour(endLocal)} (${tz})`
  }
  return `${startLabel} - ${formatDate(endLocal, true)}, ${formatHour(endLocal)} (${tz})`
}

// ── 3b. Single timestamps ────────────────────────────────────────────────────────

/** Single timestamp in the viewer's local zone, e.g. "6 Jun, 9:54 AM (EDT)". */
export function formatTimestampLocal(raw: string): string {
  const d = parseMysqlDatetimeIST(raw)
  if (!d) return ''
  const local = toLocal(d)
  return `${formatDate(local, false)}, ${formatHour(local)} (${getTzLabel()})`
}

/** Single timestamp always in IST, e.g. "6 Jun, 9:54 AM (IST)". */
export function formatTimestampIST(raw: string): string {
  const d = parseMysqlDatetimeIST(raw)
  if (!d) return ''
  return `${formatDate(d, false)}, ${formatHour(d)} (IST)`
}

// ── 3c. Calendar-day helper (viewer-local) ──────────────────────────────────────

/**
 * Whether an IST DB/ISO datetime falls on the viewer's local calendar day as of
 * `now`. IST early-morning may be the prior/next local day abroad, so this is
 * computed in the viewer's zone, not IST. Must run client-side.
 */
export function isTodayLocal(raw: string | null | undefined, now: Date = new Date()): boolean {
  const d = parseMysqlDatetimeIST(raw ?? null)
  if (!d) return false
  return toLocal(d).isSame(dayjs(now.valueOf()), 'day')
}
