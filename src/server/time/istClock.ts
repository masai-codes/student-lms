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
