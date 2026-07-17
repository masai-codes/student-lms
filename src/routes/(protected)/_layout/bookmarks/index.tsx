import { createFileRoute } from '@tanstack/react-router'
import { BookmarksPage } from '@/components/features/bookmarks/BookmarksPage'
import type { BookmarkTab } from '@/components/features/bookmarks/bookmarksConfig'
import { BOOKMARK_TABS } from '@/components/features/bookmarks/bookmarksConfig'

type BookmarksSearch = {
  tab?: BookmarkTab
  page: number
  q?: string
}

const VALID_TABS = new Set<string>(BOOKMARK_TABS.map((t) => t.id))

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

    return { tab, page, q }
  },
  component: BookmarksPage,
})
