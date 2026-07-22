import { and, eq } from 'drizzle-orm'
import { db } from '@/db'
import { menus } from '@/db/schema'

/** `menus.category` row that holds the announcement category filter values. */
const ANNOUNCEMENT_CATEGORY_MENU = 'announcement-category'

export interface AnnouncementFilterOptions {
  /** Non-deprecated category values, ordered as configured in the menus table. */
  categories: Array<string>
}

/**
 * Category filter values, sourced from the `menus` table (non-deprecated rows
 * under `announcement-category`) — mirroring the old LMS
 * `getAnnouncementColumnValuesForFilter` resolver so both LMSes stay in sync.
 */
export async function getAnnouncementFilterOptions(): Promise<AnnouncementFilterOptions> {
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

  const categories = [
    ...new Set(rows.map((row) => row.value).filter(Boolean)),
  ]
  return { categories }
}
