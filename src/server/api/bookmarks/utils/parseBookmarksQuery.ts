import {
  BOOKMARKS_PER_PAGE,
  BOOKMARK_TABS,
} from '@/components/features/bookmarks/bookmarksConfig'
import type { BookmarkTab } from '@/components/features/bookmarks/bookmarksConfig'
import { isIsoDate } from '@/components/features/bookmarks/bookmarksFilterConfig'

const VALID_TABS = new Set<string>(BOOKMARK_TABS.map((t) => t.id))

function parsePositiveInt(value: string | null): number | undefined {
  if (value === null) return undefined
  const n = parseInt(value, 10)
  return Number.isFinite(n) && n > 0 ? n : undefined
}

/** Parse a comma-separated multi-value filter param into a deduped, trimmed list. */
function parseCsv(value: string | null): Array<string> {
  if (!value) return []
  return [
    ...new Set(
      value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean),
    ),
  ]
}

function parseDate(value: string | null): string | undefined {
  return value && isIsoDate(value) ? value : undefined
}

export interface BookmarksQueryParams {
  tab: BookmarkTab
  page: number
  limit: number
  q?: string
  categories: Array<string>
  modules: Array<string>
  types: Array<string>
  statuses: Array<string>
  priorities: Array<string>
  startDate?: string
  endDate?: string
}

export function parseBookmarksQuery(url: URL): BookmarksQueryParams {
  const params = url.searchParams
  const rawTab = params.get('tab')
  const tab: BookmarkTab =
    rawTab && VALID_TABS.has(rawTab) ? (rawTab as BookmarkTab) : 'lectures'

  const page = parsePositiveInt(params.get('page')) ?? 1
  const limit = parsePositiveInt(params.get('limit')) ?? BOOKMARKS_PER_PAGE
  const q = params.get('q')?.trim() || undefined

  return {
    tab,
    page,
    limit,
    q,
    categories: parseCsv(params.get('category')),
    modules: parseCsv(params.get('module')),
    types: parseCsv(params.get('type')),
    statuses: parseCsv(params.get('status')),
    priorities: parseCsv(params.get('priority')),
    startDate: parseDate(params.get('startDate')),
    endDate: parseDate(params.get('endDate')),
  }
}
