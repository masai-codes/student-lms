/**
 * Refetch behavior shared by every Masaiverse v2 screen query.
 *
 * `refetchOnMount: 'always'` makes a query refetch whenever its screen mounts —
 * i.e. every time the user navigates to it in the SPA — even while the cached
 * copy is still within `staleTime`. The cached data renders instantly and is
 * refreshed in the background, so switching screens always lands on fresh data
 * without a full page reload (e.g. the "Registered" label shows on Home right
 * after registering, with no manual refresh).
 *
 * Spread this into a query-options factory alongside its `staleTime`.
 */
export const MASAIVERSE_V2_REFETCH_ON_NAV = {
  refetchOnMount: 'always',
} as const
