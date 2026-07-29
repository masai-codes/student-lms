import { ME_QUERY_KEY, ME_STALE_TIME } from '@/query/me/meCache'
import { fetchCurrentUser } from '@/server/auth/fetchCurrentUser'

/**
 * The signed-in user, cached for the tab so `beforeLoad` can resolve it without
 * an RPC on every navigation (issue #354).
 *
 * `gcTime` must match `staleTime`: `ensureQueryData` in a route `beforeLoad`
 * registers no observer, so with the default 5-minute `gcTime` the entry would
 * be collected — and refetched — long before it went stale.
 *
 * Import this only from route files. Components that just need to invalidate
 * should import from `meCache.ts`, which carries no server imports.
 */
export const meQuery = () => ({
  queryKey: ME_QUERY_KEY,
  queryFn: () => fetchCurrentUser(),
  staleTime: ME_STALE_TIME,
  gcTime: ME_STALE_TIME,
})
