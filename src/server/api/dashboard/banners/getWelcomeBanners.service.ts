import { and, desc, eq, isNull } from 'drizzle-orm'
import {
  buildBannerAnalyticsKey,
  getUserBannerGroup,
  isBannerVisibleToBatches,
  isBannerVisibleToGroup,
  isNonMasaiVerseBanner,
  isWithinBannerWindow,
  parseBannerVisibility,
} from './welcomeBannerVisibility'
import { db } from '@/db'
import { banners } from '@/db/schema'
import { getBatchIdsForEnrolledUser } from '@/server/batches/getBatchIdsForEnrolledUser'

/** A banner as consumed by the dashboard welcome carousel. */
export interface DashboardBanner {
  id: number
  title: string
  description: string | null
  imageUrl: string | null
  ctaUrl: string | null
  /** `<group/type_variant>` segment for the GTM click event. */
  analyticsKey: string
}

/**
 * Resolves the welcome-area banners visible to a user by composing small,
 * independently-testable pieces:
 *
 * These rules mirror the old LMS `getBanners` resolver's student path so both
 * dashboards surface the same set:
 *
 * 1. DB filter — only `is_active` and non-deleted rows are fetched.
 * 2. Masaiverse — only banners whose `settings.isMasaiVerse` is explicitly
 *    `false` (the dashboard never shows Masaiverse banners).
 * 3. Time window — kept only when both `start_date` and `end_date` are set and
 *    IST "now" is inside `[start_date, end_date]`.
 * 4. Targeting — the banner must *explicitly* target the user: one of its
 *    `visible_to.batches` matches an enrolled batch (via
 *    {@link getBatchIdsForEnrolledUser}) OR its `visible_to.random_group`
 *    contains the user's A/B/C/D bucket. Empty targeting reaches nobody.
 *
 * Ordering is newest-first; the UI handles per-refresh rotation client-side.
 */
export async function getWelcomeBanners(
  userId: number,
  now: Date = new Date(),
): Promise<Array<DashboardBanner>> {
  const batchIds = await getBatchIdsForEnrolledUser(userId)

  const rows = await db
    .select({
      id: banners.id,
      title: banners.title,
      description: banners.description,
      imageUrl: banners.imageUrl,
      ctaUrl: banners.ctaUrl,
      type: banners.type,
      variant: banners.variant,
      groupName: banners.groupName,
      visibleTo: banners.visibleTo,
      settings: banners.settings,
      startDate: banners.startDate,
      endDate: banners.endDate,
    })
    .from(banners)
    .where(and(eq(banners.isActive, 1), isNull(banners.deletedAt)))
    .orderBy(desc(banners.createdAt))

  const userBatchIds = batchIds.map(String)
  const userGroup = getUserBannerGroup(userId)
  const nowMs = now.getTime()

  return rows
    .filter((row) => {
      if (!isNonMasaiVerseBanner(row.settings as string | Record<string, unknown> | null))
        return false

      if (!isWithinBannerWindow(row.startDate, row.endDate, nowMs)) return false

      const visibility = parseBannerVisibility(
        row.visibleTo as string | Record<string, unknown> | null,
      )
      // Old-LMS parity: batch OR group match; empty targeting reaches nobody.
      if (
        !isBannerVisibleToBatches(visibility, userBatchIds) &&
        !isBannerVisibleToGroup(visibility, userGroup)
      )
        return false

      return true
    })
    .map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      imageUrl: row.imageUrl,
      ctaUrl: row.ctaUrl,
      analyticsKey: buildBannerAnalyticsKey(row.groupName, row.type, row.variant),
    }))
}
