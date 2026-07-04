import { combineAnnouncementFeeds } from './announcementFeed'
import { getSectionAnnouncements } from './getSectionAnnouncements.service'
import { getForYouMessages } from './getForYouMessages.service'
import type { DashboardAnnouncement } from './announcementFeed'
import { getSectionIdsForUser } from '@/server/batches/getSectionIdsForUser'
import { getBannedContentCutoffForUser } from '@/server/users/getBannedContentCutoffForUser'
import { getIstNowSqlDatetime } from '@/server/time/istClock'

/**
 * The dashboard announcements list: Feed A (section announcements) + Feed B
 * ("For You" messages), combined, sorted newest-first, and capped at 5.
 *
 * Composition only — the two feeds, the banned cutoff, the section lookup, and
 * the IST clock are each their own reusable piece.
 */
export async function getAnnouncementsFeed(
  userId: number,
  now: Date = new Date(),
): Promise<Array<DashboardAnnouncement>> {
  const istNow = getIstNowSqlDatetime(now)

  const [sectionIds, cutoff] = await Promise.all([
    getSectionIdsForUser(userId),
    getBannedContentCutoffForUser(userId),
  ])

  const [sectionAnnouncements, forYouMessages] = await Promise.all([
    getSectionAnnouncements(sectionIds, userId, istNow, cutoff),
    getForYouMessages(userId, istNow, cutoff),
  ])

  return combineAnnouncementFeeds([sectionAnnouncements, forYouMessages])
}
