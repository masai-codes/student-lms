import { sql, type SQL } from 'drizzle-orm'

/**
 * SQL WHERE fragments for the announcements-listing type/category filters.
 *
 * The listing blends two sources (see `getAnnouncements.service`):
 *   • `announcement` — appended to blocks that read the `announcements` table
 *     (alias `a`), where type/category are first-class columns.
 *   • `message`      — appended to blocks that read the `messages` table
 *     (alias `m`), where type/category live inside the `meta` JSON
 *     (`$.message_type` / `$.category`), mirroring the old LMS resolver.
 *
 * Each fragment either starts with ` AND …` or is empty, so it can be
 * interpolated directly after an existing WHERE clause.
 */
export interface AnnouncementFilterClauses {
  announcement: SQL
  message: SQL
}

/** ` AND <column> IN (?, ?, …)` with each value bound as a parameter. */
function inClause(column: SQL, values: Array<string>): SQL {
  const list = sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  )
  return sql` AND ${column} IN (${list})`
}

export function buildAnnouncementFilterClauses(
  types: Array<string>,
  categories: Array<string>,
): AnnouncementFilterClauses {
  let announcement: SQL = sql``
  let message: SQL = sql``

  if (types.length > 0) {
    announcement = sql`${announcement}${inClause(sql`a.type`, types)}`
    message = sql`${message}${inClause(
      sql`JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.message_type'))`,
      types,
    )}`
  }

  if (categories.length > 0) {
    announcement = sql`${announcement}${inClause(sql`a.category`, categories)}`
    message = sql`${message}${inClause(
      sql`JSON_UNQUOTE(JSON_EXTRACT(m.meta, '$.category'))`,
      categories,
    )}`
  }

  return { announcement, message }
}
