import type { LeaderboardPeriod } from '@/server/api/masaiverse-v2/services/leaderboardPeriod'
import type { QueryClient } from '@tanstack/react-query'
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

/**
 * Marks every leaderboard query stale so it refetches the next time it is shown.
 * Call this after a point-earning action (post, reply, vote, event registration)
 * so the calendar-drawer and leaderboard-page standings reflect the new points
 * when the user next opens them — without polling on every mount.
 */
export function invalidateMasaiverseV2Leaderboards(
  queryClient: QueryClient,
): void {
  // Global leaderboard, across all periods/limits.
  void queryClient.invalidateQueries({
    queryKey: ['masaiverse-v2', 'global-leaderboard'],
  })
  // Club leaderboards are keyed ['masaiverse-v2', 'club', clubId, 'leaderboard',
  // period]. Match on the 'leaderboard' segment so we don't also invalidate the
  // club-detail query, which shares the ['masaiverse-v2', 'club', clubId] prefix.
  void queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === 'masaiverse-v2' &&
      query.queryKey[1] === 'club' &&
      query.queryKey[3] === 'leaderboard',
  })
}

/** Admin user-search options; stays disabled until the query is long enough. */
export const masaiverseV2UserSearchQuery = (query: string) => ({
  queryKey: ['masaiverse-v2', 'user-search', query.trim()] as const,
  queryFn: () => searchMasaiverseV2Users(query.trim()),
  enabled: query.trim().length >= 2,
  staleTime: 30 * 1000,
})
