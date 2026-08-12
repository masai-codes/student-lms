import type { QueryClient } from '@tanstack/react-query'

/**
 * Cache identity and invalidation for the signed-in user.
 *
 * Deliberately free of server imports — the query options themselves live in
 * `meQuery.ts`, which pulls in the `fetchCurrentUser` server function (and with
 * it `@/db`). Client components only ever need to invalidate, so they import
 * from here and stay out of that graph.
 */
export const ME_QUERY_KEY = ['me'] as const

/**
 * How long the signed-in user stays cached client-side. Deliberately long: the
 * protected layout resolves it on every navigation, and re-running the server
 * function each time cost up to ~1.3s per page change (issue #354).
 *
 * Trade-off: a user deactivated mid-session can keep browsing already-cached
 * pages for up to this long. That is accepted — every API handler still resolves
 * the session per request (`requireSessionUser` → `getCurrentUserId`), so no
 * fresh data reaches a deactivated user.
 */
export const ME_STALE_TIME = 2 * 60 * 60 * 1000

/**
 * Drops the cached user so the next read fetches a fresh one. Call this wherever
 * the session or the user's own record changes: sign-in, account switch, sign-out,
 * and mutations that alter fields this payload carries (`hasSeenTryNewTour`).
 *
 * Removes rather than marks-stale on purpose: `ensureQueryData` hands back stale
 * data and only revalidates in the background, so an invalidate alone would let
 * the next navigation render the previous user.
 */
export function invalidateMeQuery(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: ME_QUERY_KEY })
}
