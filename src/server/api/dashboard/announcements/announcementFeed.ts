/**
 * Pure helpers + types for the dashboard announcements feed. Kept separate from
 * the DB services so the combine/sort/cap logic is trivially unit-testable.
 */

import { parseIstToMs } from '@/server/time/istClock'

/** A single card in the dashboard announcements list. */
export interface DashboardAnnouncement {
  id: number
  /** 'a' = announcements table, 'm' = messages ("For You"). */
  source: 'a' | 'm'
  title: string
  body: string
  authorName: string | null
  /** true when sourced from messages (rendered with a "For You" tag). */
  isForYou: boolean
  ctaName: string | null
  ctaLink: string | null
}

/** A feed item plus the timestamp it should be sorted by (schedule ?? createdAt). */
export interface RankedAnnouncement {
  item: DashboardAnnouncement
  sortedAt: string | null
}

export const DASHBOARD_ANNOUNCEMENTS_LIMIT = 5

/**
 * Combines the two feeds, sorts newest-first by `sortedAt` (schedule falling
 * back to created_at), and returns at most {@link DASHBOARD_ANNOUNCEMENTS_LIMIT}
 * items. Missing timestamps sort last.
 */
export function combineAnnouncementFeeds(
  feeds: Array<Array<RankedAnnouncement>>,
  limit: number = DASHBOARD_ANNOUNCEMENTS_LIMIT,
): Array<DashboardAnnouncement> {
  return feeds
    .flat()
    .slice()
    .sort((a, b) => toTime(b.sortedAt) - toTime(a.sortedAt))
    .slice(0, limit)
    .map((ranked) => ranked.item)
}

function toTime(value: string | null): number {
  return parseIstToMs(value) ?? Number.NEGATIVE_INFINITY
}
