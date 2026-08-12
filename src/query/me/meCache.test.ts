import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import {
  ME_QUERY_KEY,
  ME_STALE_TIME,
  invalidateMeQuery,
} from '@/query/me/meCache'

describe('meCache', () => {
  it('caches the user for two hours', () => {
    expect(ME_STALE_TIME).toBe(2 * 60 * 60 * 1000)
  })

  it('drops the cached user so the next read refetches instead of reusing it', async () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(ME_QUERY_KEY, { id: 1, name: 'Primary User' })

    invalidateMeQuery(queryClient)

    // Nothing left to serve: `ensureQueryData` must go to the queryFn. A plain
    // invalidate would have handed back the previous user here.
    expect(queryClient.getQueryState(ME_QUERY_KEY)).toBeUndefined()
    await expect(
      queryClient.ensureQueryData({
        queryKey: ME_QUERY_KEY,
        queryFn: () => Promise.resolve({ id: 2, name: 'Secondary User' }),
      }),
    ).resolves.toEqual({ id: 2, name: 'Secondary User' })
  })

  it('is a no-op when nothing is cached', () => {
    const queryClient = new QueryClient()

    expect(() => invalidateMeQuery(queryClient)).not.toThrow()
    expect(queryClient.getQueryData(ME_QUERY_KEY)).toBeUndefined()
  })
})
