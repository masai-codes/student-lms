import {
  fetchMasaiverseV2ClubDetail,
  fetchMasaiverseV2ClubEvents,
  fetchMasaiverseV2ClubStats,
  fetchMasaiverseV2MyClubs,
} from '@/lib/api/masaiverse-v2/masaiverseV2Api'

export const MASAIVERSE_V2_MY_CLUBS_KEY = ['masaiverse-v2', 'my-clubs'] as const

/** Query options for the sidebar "My Clubs" list. */
export const masaiverseV2MyClubsQuery = () => ({
  queryKey: MASAIVERSE_V2_MY_CLUBS_KEY,
  queryFn: fetchMasaiverseV2MyClubs,
  staleTime: 5 * 60 * 1000,
})

/** Query options for a single club's detail page. */
export const masaiverseV2ClubDetailQuery = (clubId: string) => ({
  queryKey: ['masaiverse-v2', 'club', clubId] as const,
  queryFn: () => fetchMasaiverseV2ClubDetail(clubId),
  staleTime: 5 * 60 * 1000,
})

/** Query options for a club's headline stats section. */
export const masaiverseV2ClubStatsQuery = (clubId: string) => ({
  queryKey: ['masaiverse-v2', 'club', clubId, 'stats'] as const,
  queryFn: () => fetchMasaiverseV2ClubStats(clubId),
  staleTime: 5 * 60 * 1000,
})

/** Query options for a club's event sections (weekly connects + upcoming + past). */
export const masaiverseV2ClubEventsQuery = (clubId: string) => ({
  queryKey: ['masaiverse-v2', 'club', clubId, 'events'] as const,
  queryFn: () => fetchMasaiverseV2ClubEvents(clubId),
  staleTime: 5 * 60 * 1000,
})
