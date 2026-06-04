import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type {
  CommunityDiscussionsPage,
  MasaiverseV2Discussion,
} from '@/server/api/masaiverse-v2/services/getCommunityDiscussions.service'
import { fetchMasaiverseV2Discussions } from '@/lib/api/masaiverse-v2/masaiverseV2Api'

export const MASAIVERSE_V2_DISCUSSIONS_KEY = [
  'masaiverse-v2',
  'discussions',
] as const

/** Page size for the "load more" pagination. */
export const DISCUSSIONS_PAGE_SIZE = 5

/** Infinite-query options for the paginated, searchable discussions list. */
export const masaiverseV2DiscussionsInfiniteQuery = (search: string) => ({
  queryKey: [...MASAIVERSE_V2_DISCUSSIONS_KEY, search],
  queryFn: ({ pageParam }: { pageParam: number }) =>
    fetchMasaiverseV2Discussions({
      offset: pageParam,
      limit: DISCUSSIONS_PAGE_SIZE,
      q: search,
    }),
  initialPageParam: 0,
  getNextPageParam: (
    lastPage: CommunityDiscussionsPage,
    allPages: Array<CommunityDiscussionsPage>,
  ) => (lastPage.hasMore ? allPages.length * DISCUSSIONS_PAGE_SIZE : undefined),
})

/**
 * Applies `update` to a discussion across every cached discussions list
 * (the key carries the search term, so we match the prefix and patch them all).
 */
function mapDiscussionInCache(
  queryClient: QueryClient,
  id: string,
  update: (discussion: MasaiverseV2Discussion) => MasaiverseV2Discussion,
): void {
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
