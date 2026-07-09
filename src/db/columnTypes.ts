/**
 * Timezone-safe Drizzle column types.
 *
 * ── The problem these solve ───────────────────────────────────────────────────
 * Two DB storage conventions look byte-for-byte identical when fetched:
 *   • `DATETIME` columns hold IST wall-clock  → "2026-07-09 03:20:00" = 03:20 IST
 *   • `TIMESTAMP` columns hold UTC instants   → "2026-07-09 03:20:00" = 03:20 UTC
 * The fetched string carries no timezone, so historically each call site had to
 * *know* which convention a column followed and pick the right parser. That
 * knowledge lived in developers' heads — a 5.5h silent-bug waiting to happen.
 *
 * ── The fix ───────────────────────────────────────────────────────────────────
 * These custom column types make the value self-describing on READ: they return
 * a normalized ISO-8601 string WITH an explicit offset, so the convention travels
 * with the data and no downstream code needs to know it:
 *   • istDatetime  → "2026-07-09T03:20:00+05:30"
 *   • utcTimestamp → "2026-07-09T03:20:00Z"
 * `new Date(v)`, `dayjs(v)`, and the existing offset-aware parsers all resolve
 * these to the correct absolute instant automatically.
 *
 * On WRITE they accept a `Date`, an offset-bearing ISO string, OR a legacy naive
 * wall-clock string, and always store the plain `YYYY-MM-DD HH:MM:SS` shape MySQL
 * expects for that column's zone — so existing insert/update code keeps working.
 *
 * Only `datetime`/`timestamp` are wrapped: they are the two types that denote an
 * *instant* and can be confused. `date` (calendar day) and `time` (clock time)
 * carry no instant, cannot be misparsed into the wrong moment, and are left as
 * the stock Drizzle builders.
 *
 * NOTE: these custom types only affect the runtime query layer and the inferred
 * row types — they never emit DDL. `src/db/schema.ts` is regenerated from the DB
 * via `npm run db:sync`, which reapplies this swap automatically.
 */

import { customType } from 'drizzle-orm/mysql-core'

/** IST is a fixed UTC+05:30 (India has no DST). */
const IST_OFFSET_MIN = 5 * 60 + 30

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0')
}

/** The wall-clock digits (zone-less) read from a Date's UTC components. */
function utcWallClock(d: Date): string {
  const base =
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  const ms = d.getUTCMilliseconds()
  return ms ? `${base}.${pad(ms, 3)}` : base
}

/**
 * Normalize whatever the driver hands us (a naive string, or a Date that mysql2
 * built by reading the naive string in the UTC session) into a zone-less
 * wall-clock ISO string `YYYY-MM-DDTHH:MM:SS[.fff]`.
 */
export function driverWallClock(value: string | Date): string {
  if (value instanceof Date) return utcWallClock(value)
  return String(value)
    .trim()
    .replace(' ', 'T')
    .replace(/(Z|[+-]\d{2}:?\d{2})$/i, '')
}

/** `+HH:MM` / `-HH:MM` / `Z` suffix for a fixed offset in minutes. */
function offsetSuffix(offsetMin: number): string {
  if (offsetMin === 0) return 'Z'
  const sign = offsetMin > 0 ? '+' : '-'
  const abs = Math.abs(offsetMin)
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}

/**
 * Parse any write-side value to epoch ms. Values with an explicit zone (or a
 * `Date`) are absolute instants; naive strings are interpreted in the column's
 * own zone (`offsetMin`), matching what a legacy caller intended.
 */
export function toEpochMs(value: string | Date, offsetMin: number): number {
  if (value instanceof Date) return value.getTime()
  const s = String(value).trim().replace(' ', 'T')
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(s)
  return new Date(hasZone ? s : `${s}${offsetSuffix(offsetMin)}`).getTime()
}

/** Epoch ms → the `YYYY-MM-DD HH:MM:SS` wall-clock string MySQL stores for `offsetMin`. */
export function toDbWallClock(epochMs: number, offsetMin: number): string {
  const shifted = new Date(epochMs + offsetMin * 60_000)
  return utcWallClock(shifted).replace('T', ' ')
}

// ── Custom Drizzle types ──────────────────────────────────────────────────────

const _istDatetime = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'datetime'
  },
  fromDriver(value) {
    return `${driverWallClock(value as unknown as string | Date)}${offsetSuffix(IST_OFFSET_MIN)}`
  },
  toDriver(value) {
    return toDbWallClock(toEpochMs(value as unknown as string | Date, IST_OFFSET_MIN), IST_OFFSET_MIN)
  },
})

const _utcTimestamp = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'timestamp'
  },
  fromDriver(value) {
    return `${driverWallClock(value as unknown as string | Date)}Z`
  },
  toDriver(value) {
    return toDbWallClock(toEpochMs(value as unknown as string | Date, 0), 0)
  },
})

/**
 * IST wall-clock `DATETIME` column. Reads resolve to an offset-stamped ISO
 * string (`…+05:30`); writes accept a Date/ISO/naive value and store IST
 * wall-clock. Drop-in for Drizzle's `datetime` (same call signatures).
 *
 * `customType` has no `.defaultNow()`/`.onUpdateNow()`; use the native
 * `.default(sql`CURRENT_TIMESTAMP`)` / `.$onUpdateFn(() => sql`CURRENT_TIMESTAMP`)`
 * instead (identical behaviour, and `CURRENT_TIMESTAMP` is UTC in a UTC session).
 */
export function istDatetime(
  nameOrConfig?: string | Record<string, unknown>,
  _config?: Record<string, unknown>,
) {
  return typeof nameOrConfig === 'string' ? _istDatetime(nameOrConfig) : _istDatetime()
}

/**
 * UTC `TIMESTAMP` column. Reads resolve to a `…Z` ISO string; writes accept a
 * Date/ISO/naive value and store UTC wall-clock. Drop-in for Drizzle's
 * `timestamp` (same call signatures). See {@link istDatetime} re: defaults.
 */
export function utcTimestamp(
  nameOrConfig?: string | Record<string, unknown>,
  _config?: Record<string, unknown>,
) {
  return typeof nameOrConfig === 'string' ? _utcTimestamp(nameOrConfig) : _utcTimestamp()
}
