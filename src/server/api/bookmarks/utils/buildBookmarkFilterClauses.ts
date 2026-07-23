import { sql, type SQL } from 'drizzle-orm'

/**
 * SQL WHERE fragments for the bookmarks filter drawer. Each builder returns an
 * empty fragment when nothing is selected, so it can be interpolated
 * unconditionally after an existing WHERE clause. Every value is bound as a
 * parameter (no string interpolation into SQL).
 */

/** ` AND <column> IN (?, ?, …)`, or empty when `values` is empty. */
function inClause(column: SQL, values: Array<string>): SQL {
  if (values.length === 0) return sql``
  const list = sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  )
  return sql` AND ${column} IN (${list})`
}

/**
 * Concatenate ` AND <column> IN (…)` fragments for each (column, values) spec.
 * Specs with no selected values contribute nothing.
 */
export function buildInClauses(
  specs: Array<{ column: SQL; values: Array<string> }>,
): SQL {
  let out: SQL = sql``
  for (const { column, values } of specs) {
    out = sql`${out}${inClause(column, values)}`
  }
  return out
}

/**
 * Lecture "Type" filter. Lectures store resources as `type = 'reading'`; a plain
 * lecture is anything else. Selecting both (or neither) applies no filter.
 */
export function buildLectureTypeClause(types: Array<string>): SQL {
  const wantsLecture = types.includes('lecture')
  const wantsResource = types.includes('resource')
  if (wantsLecture === wantsResource) return sql`` // both or neither → no filter
  if (wantsResource) return sql` AND l.type = 'reading'`
  return sql` AND (l.type <> 'reading' OR l.type IS NULL)`
}

/**
 * "Saved date" range on the bookmark-creation timestamp, compared as an IST
 * calendar day (stored UTC → +05:30), matching the app's IST rendering. Each
 * bound is optional. `createdAt` is the relevant created-at column
 * (`b.created_at`, or `cpb.created_at` for Masaiverse).
 */
export function buildSavedDateClause(
  createdAt: SQL,
  startDate?: string,
  endDate?: string,
): SQL {
  const day = sql`DATE(CONVERT_TZ(${createdAt}, '+00:00', '+05:30'))`
  if (startDate && endDate)
    return sql` AND ${day} BETWEEN ${startDate} AND ${endDate}`
  if (startDate) return sql` AND ${day} >= ${startDate}`
  if (endDate) return sql` AND ${day} <= ${endDate}`
  return sql``
}
