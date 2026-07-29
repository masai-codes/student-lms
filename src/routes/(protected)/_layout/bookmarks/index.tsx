import { createFileRoute } from '@tanstack/react-router'
import { BookmarksPage } from '@/components/features/bookmarks/BookmarksPage'
import type { BookmarkTab } from '@/components/features/bookmarks/bookmarksConfig'
import { BOOKMARK_TABS } from '@/components/features/bookmarks/bookmarksConfig'
import {
  isIsoDate,
  normalizeFilterValues,
} from '@/components/features/bookmarks/bookmarksFilterConfig'

type BookmarksSearch = {
  tab?: BookmarkTab
  page: number
  q?: string
  category?: Array<string>
  module?: Array<string>
  type?: Array<string>
  status?: Array<string>
  priority?: Array<string>
  startDate?: string
  endDate?: string
}

const VALID_TABS = new Set<string>(BOOKMARK_TABS.map((t) => t.id))

function arrayOrUndefined(raw: unknown): Array<string> | undefined {
  const values = normalizeFilterValues(raw)
  return values.length > 0 ? values : undefined
}

function dateOrUndefined(raw: unknown): string | undefined {
  return typeof raw === 'string' && isIsoDate(raw) ? raw : undefined
}

export const Route = createFileRoute('/(protected)/_layout/bookmarks/')({
  validateSearch: (raw): BookmarksSearch => {
    const tab =
      typeof raw.tab === 'string' && VALID_TABS.has(raw.tab)
        ? (raw.tab as BookmarkTab)
        : undefined

    const rawPage = typeof raw.page === 'number' ? raw.page : Number(raw.page)
    const page =
      Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1

    const q = typeof raw.q === 'string' && raw.q.length > 0 ? raw.q : undefined

    return {
      tab,
      page,
      q,
      category: arrayOrUndefined(raw.category),
      module: arrayOrUndefined(raw.module),
      type: arrayOrUndefined(raw.type),
      status: arrayOrUndefined(raw.status),
      priority: arrayOrUndefined(raw.priority),
      startDate: dateOrUndefined(raw.startDate),
      endDate: dateOrUndefined(raw.endDate),
    }
  },
  component: BookmarksPage,
})
