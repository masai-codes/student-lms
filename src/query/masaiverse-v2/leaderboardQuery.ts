import type { LeaderboardPeriod } from '@/server/api/masaiverse-v2/services/leaderboardPeriod'
import {
  fetchMasaiverseV2GlobalLeaderboard,
  searchMasaiverseV2Users,
} from '@/lib/api/masaiverse-v2/masaiverseV2Api'

/** Query options for the community-wide (global) leaderboard for a period. */
export const masaiverseV2GlobalLeaderboardQuery = (
  period: LeaderboardPeriod = 'overall',
  limit?: number,
) => ({
  queryKey: [
    'masaiverse-v2',
    'global-leaderboard',
    period,
    limit ?? null,
  ] as const,
  queryFn: () => fetchMasaiverseV2GlobalLeaderboard({ period, limit }),
  staleTime: 60 * 1000,
})

/** Admin user-search options; stays disabled until the query is long enough. */
export const masaiverseV2UserSearchQuery = (query: string) => ({
  queryKey: ['masaiverse-v2', 'user-search', query.trim()] as const,
  queryFn: () => searchMasaiverseV2Users(query.trim()),
  enabled: query.trim().length >= 2,
  staleTime: 30 * 1000,
})
