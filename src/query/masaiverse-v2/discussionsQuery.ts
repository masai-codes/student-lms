import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type {
  CommunityDiscussionsPage,
  MasaiverseV2Discussion,
} from '@/server/api/masaiverse-v2/services/getCommunityDiscussions.service'
import { fetchMasaiverseV2Discussions } from '@/lib/api/masaiverse-v2/masaiverseV2Api'
import { MASAIVERSE_V2_HOME_KEY } from '@/query/masaiverse-v2/homeQuery'
import { MASAIVERSE_V2_REFETCH_ON_NAV } from '@/query/masaiverse-v2/queryDefaults'

export const MASAIVERSE_V2_DISCUSSIONS_KEY = [
  'masaiverse-v2',
  'discussions',
] as const

/** Page size for the "load more" pagination. */
const DISCUSSIONS_PAGE_SIZE = 5

/**
 * Reserved `?tab=` value for the club-less community feed on the discussions
 * page. Club tabs use their numeric club id, so this can't collide with one.
 * Shared so "View all" links and the page itself agree on the value.
 */
export const DISCUSSIONS_PUBLIC_TAB = 'public'

/**
 * Infinite-query options for the paginated, searchable discussions list.
 * Pass a `clubId` to scope to a single club; omit it for the community feed.
 */
export const masaiverseV2DiscussionsInfiniteQuery = (
  search: string,
  clubId?: string,
) => ({
  queryKey: [...MASAIVERSE_V2_DISCUSSIONS_KEY, clubId ?? null, search],
  queryFn: ({ pageParam }: { pageParam: number }) =>
    fetchMasaiverseV2Discussions({
      offset: pageParam,
      limit: DISCUSSIONS_PAGE_SIZE,
      q: search,
      ...(clubId ? { clubId } : {}),
    }),
  initialPageParam: 0,
  getNextPageParam: (
    lastPage: CommunityDiscussionsPage,
    allPages: Array<CommunityDiscussionsPage>,
  ) => (lastPage.hasMore ? allPages.length * DISCUSSIONS_PAGE_SIZE : undefined),
  ...MASAIVERSE_V2_REFETCH_ON_NAV,
})

/** A cached payload that embeds a flat `discussions` array (home, club detail). */
type DiscussionsEmbed = { discussions: Array<MasaiverseV2Discussion> }

/**
 * Applies `update` to a discussion everywhere it's cached, so vote/reply changes
 * show without a reload regardless of which screen the user is on:
 *  - the paginated/searchable feed (`['masaiverse-v2', 'discussions', …]`),
 *  - the home payload (`['masaiverse-v2', 'home']`), and
 *  - any club detail payload (`['masaiverse-v2', 'club', clubId]`).
 * The feed key carries clubId + search, so we match its prefix and patch them all.
 */
function mapDiscussionInCache(
  queryClient: QueryClient,
  id: string,
  update: (discussion: MasaiverseV2Discussion) => MasaiverseV2Discussion,
): void {
  // The paginated / searchable infinite feed (View all, discussions page).
  queryClient.setQueriesData<InfiniteData<CommunityDiscussionsPage>>(
    { queryKey: MASAIVERSE_V2_DISCUSSIONS_KEY },
    (prev) =>
      prev
        ? {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              discussions: page.discussions.map((d) =>
                d.id === id ? update(d) : d,
              ),
            })),
          }
        : prev,
  )

  // Payloads that embed the newest discussions inline: the home page and every
  // cached club detail page. The `['masaiverse-v2', 'club']` prefix also matches
  // sibling caches (stats, leaderboard, events) that have no `discussions`
  // array, so we guard before mapping and leave those untouched.
  const patchEmbed = (prev: DiscussionsEmbed | undefined) =>
    prev && Array.isArray(prev.discussions)
      ? {
          ...prev,
          discussions: prev.discussions.map((d) =>
            d.id === id ? update(d) : d,
          ),
        }
      : prev
  queryClient.setQueryData<DiscussionsEmbed>(MASAIVERSE_V2_HOME_KEY, patchEmbed)
  queryClient.setQueriesData<DiscussionsEmbed>(
    { queryKey: ['masaiverse-v2', 'club'] },
    patchEmbed,
  )
}

/** Patches a single discussion across the cached pages (e.g. vote state). */
export function patchDiscussionInCache(
  queryClient: QueryClient,
  id: string,
  patch: Partial<MasaiverseV2Discussion>,
): void {
  mapDiscussionInCache(queryClient, id, (d) => ({ ...d, ...patch }))
}

/** Increments a discussion's reply count in the cache after posting a reply. */
export function incrementReplyCountInCache(
  queryClient: QueryClient,
  id: string,
): void {
  mapDiscussionInCache(queryClient, id, (d) => ({
    ...d,
    replyCount: d.replyCount + 1,
  }))
}
