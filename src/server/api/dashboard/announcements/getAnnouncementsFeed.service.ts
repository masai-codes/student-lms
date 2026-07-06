import { combineAnnouncementFeeds } from './announcementFeed'
import { getSectionAnnouncements } from './getSectionAnnouncements.service'
import { getForYouMessages } from './getForYouMessages.service'
import type { DashboardAnnouncement } from './announcementFeed'
import { getSectionIdsForUser } from '@/server/batches/getSectionIdsForUser'
import { getIstNowSqlDatetime } from '@/server/time/istClock'

/**
 * The dashboard announcements list: Feed A (section announcements) + Feed B
 * ("For You" messages), combined, sorted newest-first, and capped at 5.
 *
 * Composition only — the two feeds, the section lookup, and the IST clock are
 * each their own reusable piece.
 */
export async function getAnnouncementsFeed(
  userId: number,
  now: Date = new Date(),
): Promise<Array<DashboardAnnouncement>> {
  const istNow = getIstNowSqlDatetime(now)

  const sectionIds = await getSectionIdsForUser(userId)

  const [sectionAnnouncements, forYouMessages] = await Promise.all([
    getSectionAnnouncements(sectionIds, userId, istNow),
    getForYouMessages(userId, istNow),
  ])

  return combineAnnouncementFeeds([sectionAnnouncements, forYouMessages])
}
