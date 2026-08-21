import { desc } from 'drizzle-orm'
import { db } from '@/db'
import { whatsnew } from '@/db/schema'

/** A product-update card sourced from the global `whatsnew` table. */
export interface DashboardProductUpdate {
  id: number
  title: string
  imageUrl: string | null
}

/** Backend page size for the product-updates listing. */
const PRODUCT_UPDATES_PAGE_SIZE = 25
/** How many product updates the dashboard card surfaces. */
export const DASHBOARD_PRODUCT_UPDATES_LIMIT = 5

/**
 * Newest global product updates (`whatsnew`), same for everyone — no batch,
 * section, or read targeting. Returned newest-first, paginated with `limit`
 * (default 25/page) + `offset`.
 */
export async function getProductUpdates(
  limit: number = PRODUCT_UPDATES_PAGE_SIZE,
  offset = 0,
): Promise<Array<DashboardProductUpdate>> {
  const rows = await db
    .select({
      id: whatsnew.id,
      title: whatsnew.subject,
      image: whatsnew.image,
    })
    .from(whatsnew)
    .orderBy(desc(whatsnew.createdAt))
    .limit(limit)
    .offset(offset)

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    imageUrl: row.image,
  }))
}
