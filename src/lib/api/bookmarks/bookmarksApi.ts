import { fetchJson } from '@/lib/api/fetchJson'
import { BOOKMARKS_API } from '@/lib/api/bookmarksPaths'
import type { BookmarkItem } from '@/server/api/bookmarks/getBookmarks.service'
import type { BookmarkTab } from '@/components/features/bookmarks/bookmarksConfig'

export interface FetchBookmarksParams {
  tab: BookmarkTab
  page: number
  limit: number
  q?: string
}

export interface FetchBookmarksResult {
  bookmarks: Array<BookmarkItem>
  total: number
}

export async function fetchBookmarks(
  params: FetchBookmarksParams,
): Promise<FetchBookmarksResult> {
  const search = new URLSearchParams({
    tab: params.tab,
    page: String(params.page),
    limit: String(params.limit),
  })
  if (params.q) search.set('q', params.q)

  return fetchJson<FetchBookmarksResult>(
    `${BOOKMARKS_API.list}?${search.toString()}`,
  )
}
