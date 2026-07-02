import { and, desc, eq, isNull } from 'drizzle-orm'
import {
  getIstNowMs,
  getUserBannerGroup,
  isBannerVisibleToBatches,
  isBannerVisibleToGroup,
  isWithinBannerWindow,
  parseBannerVisibility,
} from './welcomeBannerVisibility'
import { db } from '@/db'
import { banners } from '@/db/schema'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'
import { isContentWithinBannedCutoff } from '@/server/users/bannedContent'
import { getBannedContentCutoffForUser } from '@/server/users/getBannedContentCutoffForUser'

/** A banner as consumed by the dashboard welcome carousel. */
export interface DashboardBanner {
  id: number
  title: string
  description: string | null
  imageUrl: string | null
  ctaUrl: string | null
}

/**
 * Resolves the welcome-area banners visible to a user by composing small,
 * independently-testable pieces:
 *
 * 1. DB filter — only `is_active` and non-deleted rows are fetched.
 * 2. Time window — kept only when IST "now" is inside `[start_date, end_date]`.
 * 3. Batch targeting — `visible_to.batches` empty, or intersects the user's
 *    enrolled batches (resolved via {@link getBatchIdsForEnrolledUser}).
 * 4. Group targeting — `visible_to.random_group` empty, or contains the user's
 *    A/B/C/D bucket.
 * 5. Banned cutoff — for banned users, banners created/started after their ban
 *    time are hidden.
 *
 * Ordering is newest-first; the UI handles per-refresh rotation client-side.
 */
export async function getWelcomeBanners(
  userId: number,
  now: Date = new Date(),
): Promise<Array<DashboardBanner>> {
  const [batchIds, cutoff] = await Promise.all([
    getBatchIdsForEnrolledUser(userId),
    getBannedContentCutoffForUser(userId),
  ])

  const rows = await db
    .select({
      id: banners.id,
      title: banners.title,
      description: banners.description,
      imageUrl: banners.imageUrl,
      ctaUrl: banners.ctaUrl,
      visibleTo: banners.visibleTo,
      startDate: banners.startDate,
      endDate: banners.endDate,
      createdAt: banners.createdAt,
    })
    .from(banners)
    .where(and(eq(banners.isActive, 1), isNull(banners.deletedAt)))
    .orderBy(desc(banners.createdAt))

  const userBatchIds = batchIds.map(String)
  const userGroup = getUserBannerGroup(userId)
  const istNowMs = getIstNowMs(now.getTime())

  return rows
    .filter((row) => {
      if (!isWithinBannerWindow(row.startDate, row.endDate, istNowMs)) return false

      const visibility = parseBannerVisibility(
        row.visibleTo as string | Record<string, unknown> | null,
      )
      if (!isBannerVisibleToBatches(visibility, userBatchIds)) return false
      if (!isBannerVisibleToGroup(visibility, userGroup)) return false

      return isContentWithinBannedCutoff(
        { createdAt: row.createdAt, startDate: row.startDate },
        cutoff,
      )
    })
    .map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.imageUrl,
      ctaUrl: row.ctaUrl,
    }))
}
