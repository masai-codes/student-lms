/**
 * IST (UTC+5:30) clock helpers for server-side queries.
 *
 * Several tables store `DATETIME` columns as IST wall-clock with no timezone
 * (e.g. announcement/message `schedule` / `concludes`). To compare them in the
 * Drizzle query builder we bind "now" as an IST wall-clock string in the same
 * `YYYY-MM-DD HH:MM:SS` shape MySQL expects, instead of using `CONVERT_TZ` in
 * raw SQL.
 */

const IST_OFFSET_MINUTES = 5 * 60 + 30

/**
 * Current time as an IST wall-clock `YYYY-MM-DD HH:MM:SS` string suitable for
 * `<=` / `>=` comparisons against IST-stored DATETIME columns.
 */
export function getIstNowSqlDatetime(now: Date = new Date()): string {
  const ist = new Date(now.getTime() + IST_OFFSET_MINUTES * 60_000)
  return ist.toISOString().slice(0, 19).replace('T', ' ')
}

/**
 * The IST-day window `[start of today, end of (today + daysAhead)]` as
 * `YYYY-MM-DD HH:MM:SS` wall-clock strings, for range-filtering IST-stored
 * DATETIME columns.
 */
export function getIstDayWindow(
  now: Date,
  daysAhead: number,
): { start: string; end: string } {
  const ist = new Date(now.getTime() + IST_OFFSET_MINUTES * 60_000)
  const y = ist.getUTCFullYear()
  const m = ist.getUTCMonth()
  const d = ist.getUTCDate()

  const endDay = new Date(Date.UTC(y, m, d + daysAhead))

  return {
    start: `${isoDate(y, m, d)} 00:00:00`,
    end: `${isoDate(endDay.getUTCFullYear(), endDay.getUTCMonth(), endDay.getUTCDate())} 23:59:59`,
  }
}

/**
 * Formats an IST wall-clock DATETIME string (`YYYY-MM-DD HH:MM:SS`) as an
 * explicit IST ISO-8601 string (`YYYY-MM-DDTHH:MM:SS+05:30`). Returns `null`
 * for null/empty input.
 */
export function formatIstWallClock(value: string | null): string | null {
  if (!value) return null
  return `${value.replace(' ', 'T')}+05:30`
}

/**
 * Parses a DB datetime value into an absolute epoch-ms instant, treating
 * timezone-less values as IST wall-clock (`+05:30`).
 *
 * Our DATETIME/DATE columns are stored as IST wall-clock strings with no
 * timezone (e.g. `"2026-07-08 17:15:00"`). Parsing them with a bare
 * `new Date(value)` interprets them in the *process* timezone — correct on an
 * IST laptop, but 5h30m off on a UTC server (EC2). Always route DB datetimes
 * through this so the result is the same absolute instant everywhere.
 *
 * - `"YYYY-MM-DD HH:MM:SS"` / `"YYYY-MM-DDTHH:MM:SS"` → interpreted as IST.
 * - `"YYYY-MM-DD"` (date-only) → IST midnight.
 * - Values that already carry an explicit zone (`…Z` or `±HH:MM`) are trusted
 *   as-is (already an absolute instant).
 * - `null` / empty / unparseable → `null`.
 */
export function parseIstToMs(value: string | null | undefined): number | null {
  if (value == null) return null
  const trimmed = value.trim()
  if (trimmed === '') return null

  // Already has an explicit timezone -> it's already an absolute instant.
  if (/[zZ]$/.test(trimmed) || /[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    const ms = new Date(trimmed.replace(' ', 'T')).getTime()
    return Number.isFinite(ms) ? ms : null
  }

  // Date-only value -> treat as IST midnight.
  const withTime = /\d{1,2}:\d{2}/.test(trimmed)
    ? trimmed
    : `${trimmed} 00:00:00`

  const ms = new Date(`${withTime.replace(' ', 'T')}+05:30`).getTime()
  return Number.isFinite(ms) ? ms : null
}

function isoDate(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}
