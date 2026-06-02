import { getCommunityLearnerCount } from '@/server/api/masaiverse-v2/services/getCommunityLearnerCount.service'
import { getDiscussionsThisWeekCount } from '@/server/api/masaiverse-v2/services/getDiscussionsThisWeekCount.service'
import { getEventRegistrationsThisYearCount } from '@/server/api/masaiverse-v2/services/getEventRegistrationsThisYearCount.service'
import { getEventsThisYearCount } from '@/server/api/masaiverse-v2/services/getEventsThisYearCount.service'

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
  /** Distinct learners who belong to at least one club. */
  learnersInCommunity: number
  /** Posts + replies created in the current IST week. */
  discussionsThisWeek: number
  /** Public + club events scheduled in the current IST year. */
  eventsThisYear: number
  /** Event registrations made in the current IST year. */
  eventRegistrationsThisYear: number
}

export interface MasaiverseV2HomeData {
  stats: MasaiverseV2CommunityStats
}

export async function getMasaiverseV2Home(
  _userId: number,
  now: Date = new Date(),
): Promise<MasaiverseV2HomeData> {
  const [
    learnersInCommunity,
    discussionsThisWeek,
    eventsThisYear,
    eventRegistrationsThisYear,
  ] = await Promise.all([
    getCommunityLearnerCount(),
    getDiscussionsThisWeekCount(now),
    getEventsThisYearCount(now),
    getEventRegistrationsThisYearCount(now),
  ])

  return {
    stats: {
      learnersInCommunity,
      discussionsThisWeek,
      eventsThisYear,
      eventRegistrationsThisYear,
    },
  }
}
