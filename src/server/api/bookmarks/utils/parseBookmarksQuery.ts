import {
  BOOKMARKS_PER_PAGE,
  BOOKMARK_TABS,
} from '@/components/features/bookmarks/bookmarksConfig'
import type { BookmarkTab } from '@/components/features/bookmarks/bookmarksConfig'

const VALID_TABS = new Set<string>(BOOKMARK_TABS.map((t) => t.id))

function parsePositiveInt(value: string | null): number | undefined {
  if (value === null) return undefined
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

export interface BookmarksQueryParams {
  tab: BookmarkTab
  page: number
  limit: number
  q?: string
}

export function parseBookmarksQuery(url: URL): BookmarksQueryParams {
  const rawTab = url.searchParams.get('tab')
  const tab: BookmarkTab =
    rawTab && VALID_TABS.has(rawTab) ? (rawTab as BookmarkTab) : 'lectures'

  const page = parsePositiveInt(url.searchParams.get('page')) ?? 1
  const limit =
    parsePositiveInt(url.searchParams.get('limit')) ?? BOOKMARKS_PER_PAGE
  const q = url.searchParams.get('q')?.trim() || undefined

  return { tab, page, limit, q }
}
