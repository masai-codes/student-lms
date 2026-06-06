import { fetchMasaiverseV2GlobalLeaderboard } from '@/lib/api/masaiverse-v2/masaiverseV2Api'

/** Query options for the community-wide (global) leaderboard. */
export const masaiverseV2GlobalLeaderboardQuery = (limit?: number) => ({
  queryKey: ['masaiverse-v2', 'global-leaderboard', limit ?? null] as const,
  queryFn: () => fetchMasaiverseV2GlobalLeaderboard(limit),
  staleTime: 60 * 1000,
})
