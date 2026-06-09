import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it } from 'vitest'
import { invalidateMasaiverseV2Leaderboards } from './leaderboardQuery'

function isInvalidated(client: QueryClient, queryKey: ReadonlyArray<unknown>) {
  return client.getQueryCache().find({ queryKey })?.state.isInvalidated ?? false
}

let client: QueryClient | undefined

afterEach(() => {
  client?.clear()
})

describe('invalidateMasaiverseV2Leaderboards', () => {
  it('invalidates global and club leaderboard queries', () => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    // Seed the cache without observers so invalidation only marks them stale.
    const globalKey = ['masaiverse-v2', 'global-leaderboard', 'overall', 10]
    const clubLeaderboardKey = [
      'masaiverse-v2',
      'club',
      '81910',
      'leaderboard',
      'overall',
    ]
    client.setQueryData(globalKey, [])
    client.setQueryData(clubLeaderboardKey, [])

    invalidateMasaiverseV2Leaderboards(client)

    expect(isInvalidated(client, globalKey)).toBe(true)
    expect(isInvalidated(client, clubLeaderboardKey)).toBe(true)
  })

  it('does not invalidate the club-detail query that shares the club prefix', () => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const clubDetailKey = ['masaiverse-v2', 'club', '81910']
    const unrelatedKey = ['masaiverse-v2', 'home']
    client.setQueryData(clubDetailKey, { id: '81910' })
    client.setQueryData(unrelatedKey, {})

    invalidateMasaiverseV2Leaderboards(client)

    expect(isInvalidated(client, clubDetailKey)).toBe(false)
    expect(isInvalidated(client, unrelatedKey)).toBe(false)
  })
})
