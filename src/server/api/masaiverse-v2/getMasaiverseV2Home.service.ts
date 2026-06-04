import type { MasaiverseV2HomeClub } from '@/server/api/masaiverse-v2/services/getHomeClubs.service'
import type { MasaiverseV2HomeEvent } from '@/server/api/masaiverse-v2/services/getHomeEvents.service'
import type { MasaiverseV2HomeHighlight } from '@/server/api/masaiverse-v2/services/getHomeHighlights.service'
import { getCommunityLearnerCount } from '@/server/api/masaiverse-v2/services/getCommunityLearnerCount.service'
import { getDiscussionsThisWeekCount } from '@/server/api/masaiverse-v2/services/getDiscussionsThisWeekCount.service'
import { getEventRegistrationsThisYearCount } from '@/server/api/masaiverse-v2/services/getEventRegistrationsThisYearCount.service'
import { getEventsThisYearCount } from '@/server/api/masaiverse-v2/services/getEventsThisYearCount.service'
import { getHomeClubs } from '@/server/api/masaiverse-v2/services/getHomeClubs.service'
import { getHomeEvents } from '@/server/api/masaiverse-v2/services/getHomeEvents.service'
import { getHomeHighlights } from '@/server/api/masaiverse-v2/services/getHomeHighlights.service'
import { getMemberClubIds } from '@/server/api/masaiverse-v2/services/getMemberClubIds.service'

/**
 * Masaiverse v2 aggregated home data.
 *
 * The v2 design collapses the home page into a single GET so the page renders
 * from one request. Each section is backed by independent, reusable services
 * (under `./services`) that other endpoints can call in isolation; this
 * orchestrator just fans out and composes their results.
 *
 * Sections are added incrementally — for now it returns Section 1's community
 * headline stats.
 */
export interface MasaiverseV2CommunityStats {
  /** Users who have opened Masaiverse at least once. */
  learnersInCommunity: number
  /** Posts + replies created in the current IST week. */
  discussionsThisWeek: number
  /** Public + club events scheduled in the current IST year. */
  eventsThisYear: number
  /** Event registrations made in the current IST year. */
  eventRegistrationsThisYear: number
}

export interface MasaiverseV2HomeData {
  /** Section 1 — community headline stats. */
  stats: MasaiverseV2CommunityStats
  /** Section 2 — live or upcoming events. */
  events: Array<MasaiverseV2HomeEvent>
  /** Section 3 — recaps of past events. */
  highlights: Array<MasaiverseV2HomeHighlight>
  /** Section 4 — all clubs with member counts. */
  clubs: Array<MasaiverseV2HomeClub>
}

export async function getMasaiverseV2Home(
  userId: number,
  now: Date = new Date(),
): Promise<MasaiverseV2HomeData> {
  // Home shows public (club-less) events plus the events of clubs this user has
  // joined — both in "Live & Upcoming" and "Past Events".
  const memberClubIds = await getMemberClubIds(userId)
  const [
    learnersInCommunity,
    discussionsThisWeek,
    eventsThisYear,
    eventRegistrationsThisYear,
    events,
    highlights,
    clubs,
  ] = await Promise.all([
    getCommunityLearnerCount(),
    getDiscussionsThisWeekCount(now),
    getEventsThisYearCount(now),
    getEventRegistrationsThisYearCount(now),
    getHomeEvents(now, { visibleClubIds: memberClubIds }, userId),
    getHomeHighlights(now, { visibleClubIds: memberClubIds }),
    getHomeClubs(),
  ])

  return {
    stats: {
      learnersInCommunity,
      discussionsThisWeek,
      eventsThisYear,
      eventRegistrationsThisYear,
    },
    events,
    highlights,
    clubs,
  }
}
