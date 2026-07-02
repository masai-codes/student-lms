import { desc } from 'drizzle-orm'
import { db } from '@/db'
import { whatsnew } from '@/db/schema'
import { isContentWithinBannedCutoff } from '@/server/users/bannedContent'
import { getBannedContentCutoffForUser } from '@/server/users/getBannedContentCutoffForUser'

/** A product-update card sourced from the global `whatsnew` table. */
export interface DashboardProductUpdate {
  id: number
  title: string
  imageUrl: string | null
}

/** Backend page size for the product-updates listing. */
export const PRODUCT_UPDATES_PAGE_SIZE = 25
/** How many product updates the dashboard card surfaces. */
export const DASHBOARD_PRODUCT_UPDATES_LIMIT = 5

/**
 * Newest global product updates (`whatsnew`), same for everyone — no batch,
 * section, or read targeting. The only filter is the banned-content cutoff:
 * banned users don't see updates created after their ban time. Returned
 * newest-first, paginated with `limit` (default 25/page) + `offset`.
 */
export async function getProductUpdates(
  userId: number,
  limit: number = PRODUCT_UPDATES_PAGE_SIZE,
  offset = 0,
): Promise<Array<DashboardProductUpdate>> {
  const [cutoff, rows] = await Promise.all([
    getBannedContentCutoffForUser(userId),
    db
      .select({
        id: whatsnew.id,
        title: whatsnew.subject,
        image: whatsnew.image,
        createdAt: whatsnew.createdAt,
      })
      .from(whatsnew)
      .orderBy(desc(whatsnew.createdAt))
      .limit(limit)
      .offset(offset),
  ])

  return rows
    .filter((row) => isContentWithinBannedCutoff({ createdAt: row.createdAt }, cutoff))
    .map((row) => ({ id: row.id, title: row.title, imageUrl: row.image }))
}
