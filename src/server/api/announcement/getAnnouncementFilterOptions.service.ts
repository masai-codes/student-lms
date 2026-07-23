import { and, eq, isNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import { menus, sectionUser } from '@/db/schema'

/** `menus.category` row that holds the announcement category filter values. */
const ANNOUNCEMENT_CATEGORY_MENU = 'announcement-category'

export interface AnnouncerOption {
  id: string
  name: string
}

export interface AnnouncementFilterOptions {
  /** Non-deprecated category values, ordered as configured in the menus table. */
  categories: Array<string>
  /** Distinct authors of announcements visible in the user's sections. */
  announcers: Array<AnnouncerOption>
}

function rowsOf(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) {
    const first = result[0]
    if (Array.isArray(first)) return first as Array<Record<string, unknown>>
    return result as Array<Record<string, unknown>>
  }
  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray(result.rows)
  ) {
    return (result as { rows: Array<Record<string, unknown>> }).rows
  }
  return []
}

async function getCategories(): Promise<Array<string>> {
  const rows = await db
    .select({ value: menus.value })
    .from(menus)
    .where(
      and(
        eq(menus.category, ANNOUNCEMENT_CATEGORY_MENU),
        eq(menus.deprecated, 0),
      ),
    )
    .orderBy(menus.ordering)
  return [...new Set(rows.map((row) => row.value).filter(Boolean))]
}

async function getAnnouncers(userId: number): Promise<Array<AnnouncerOption>> {
  const sectionRows = await db
    .select({ sectionId: sectionUser.sectionId })
    .from(sectionUser)
    .where(and(eq(sectionUser.userId, userId), isNull(sectionUser.deletedAt)))

  const sectionIds = [...new Set(sectionRows.map((r) => r.sectionId))].filter(
    Number.isFinite,
  )
  if (sectionIds.length === 0) return []

  const result = await db.execute(sql`
    SELECT DISTINCT u.id AS id, u.name AS name
    FROM announcements a
    INNER JOIN users u ON u.id = a.user_id
    WHERE a.section_id IN (${sql.join(
      sectionIds.map((id) => sql`${id}`),
      sql`, `,
    )})
      AND a.deleted_at IS NULL
      AND u.name IS NOT NULL
    ORDER BY u.name
  `)

  return rowsOf(result)
    .map((row) => ({ id: String(row['id']), name: String(row['name'] ?? '') }))
    .filter((a) => a.name.trim() !== '')
}

/**
 * Filter option values for the announcements drawer. Categories come from the
 * `menus` table (mirroring the old LMS resolver); announcers are the distinct
 * authors of announcements in the user's sections.
 */
export async function getAnnouncementFilterOptions(
  userId: number,
): Promise<AnnouncementFilterOptions> {
  const [categories, announcers] = await Promise.all([
    getCategories(),
    getAnnouncers(userId),
  ])
  return { categories, announcers }
}
