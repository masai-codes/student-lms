import { fetchJson } from '@/lib/api/fetchJson'
import { BOOKMARKS_API } from '@/lib/api/bookmarksPaths'
import type { BookmarkItem } from '@/server/api/bookmarks/getBookmarks.service'
import type { BookmarkTab } from '@/components/features/bookmarks/bookmarksConfig'
import type { BookmarkFilters } from '@/components/features/bookmarks/bookmarksFilterConfig'

export interface FetchBookmarksParams {
  tab: BookmarkTab
  page: number
  limit: number
  q?: string
  filters?: BookmarkFilters
}

export interface FetchBookmarksResult {
  bookmarks: Array<BookmarkItem>
  total: number
}

export interface BookmarkFilterOptionsResult {
  categories: Array<string>
  modules: Array<string>
  statuses: Array<string>
  priorities: Array<string>
}

function setCsv(
  search: URLSearchParams,
  key: string,
  values: Array<string> | undefined,
): void {
  if (values && values.length > 0) search.set(key, values.join(','))
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

  const f = params.filters
  if (f) {
    setCsv(search, 'category', f.categories)
    setCsv(search, 'module', f.modules)
    setCsv(search, 'type', f.types)
    setCsv(search, 'status', f.statuses)
    setCsv(search, 'priority', f.priorities)
    if (f.startDate) search.set('startDate', f.startDate)
    if (f.endDate) search.set('endDate', f.endDate)
  }

  return fetchJson<FetchBookmarksResult>(
    `${BOOKMARKS_API.list}?${search.toString()}`,
  )
}

export async function fetchBookmarkFilterOptions(
  tab: BookmarkTab,
): Promise<BookmarkFilterOptionsResult> {
  const search = new URLSearchParams({ tab })
  return fetchJson<BookmarkFilterOptionsResult>(
    `${BOOKMARKS_API.filterOptions}?${search.toString()}`,
  )
}
