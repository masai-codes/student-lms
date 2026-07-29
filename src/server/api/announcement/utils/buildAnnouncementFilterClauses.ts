import { sql, type SQL } from 'drizzle-orm'

/**
 * SQL WHERE fragments for the announcements-listing filter drawer.
 *
 * The listing blends two sources (see `getAnnouncements.service`):
 *   • `announcement` — appended to blocks that read the `announcements` table
 *     (alias `a`): type/category are columns, author is `a.user_id`, and the
 *     announced date is `a.schedule` (falling back to `a.created_at`).
 *   • `message`      — appended to blocks that read the `messages` table
 *     (alias `m`): type/category live in `meta` JSON, author is `m.author_id`,
 *     and the date is `m.schedule` (falling back to `m.created_at`).
 *
 * Each fragment either starts with ` AND …` or is empty, so it can be
 * interpolated directly after an existing WHERE clause. Every value is bound as
 * a parameter.
 */
export interface AnnouncementFilterInput {
  types: Array<string>
  categories: Array<string>
  /** Author user ids (as strings). */
  announcedBy: Array<string>
  startDate?: string
  endDate?: string
}

export interface AnnouncementFilterClauses {
  announcement: SQL
  message: SQL
}

function inClause(column: SQL, values: Array<string>): SQL {
  if (values.length === 0) return sql``
  const list = sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  )
  return sql` AND ${column} IN (${list})`
}

/** IST calendar-day range on a timestamp column; each bound optional. */
function dateClause(column: SQL, startDate?: string, endDate?: string): SQL {
  const day = sql`DATE(CONVERT_TZ(${column}, '+00:00', '+05:30'))`
  if (startDate && endDate)
    return sql` AND ${day} BETWEEN ${startDate} AND ${endDate}`
  if (startDate) return sql` AND ${day} >= ${startDate}`
  if (endDate) return sql` AND ${day} <= ${endDate}`
  return sql``
}

export function buildAnnouncementFilterClauses({
  types,
  categories,
  announcedBy,
  startDate,
  endDate,
}: AnnouncementFilterInput): AnnouncementFilterClauses {
  const announcement = sql`${inClause(sql`a.type`, types)}${inClause(
    sql`a.category`,
    categories,
  )}${inClause(sql`a.user_id`, announcedBy)}${dateClause(
    sql`COALESCE(a.schedule, a.created_at)`,
    startDate,
    endDate,
  )}`

  const message = sql`${inClause(
    sql`JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.message_type'))`,
    types,
  )}${inClause(
    sql`JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.category'))`,
    categories,
  )}${inClause(sql`m.author_id`, announcedBy)}${dateClause(
    sql`COALESCE(m.schedule, m.created_at)`,
    startDate,
    endDate,
  )}`

  return { announcement, message }
}
