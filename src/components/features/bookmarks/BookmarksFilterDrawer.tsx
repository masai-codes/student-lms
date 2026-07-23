import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal } from 'lucide-react'
import { MasaiDrawer } from '@/components/ui/masai-drawer'
import { fetchBookmarkFilterOptions } from '@/lib/api/bookmarks/bookmarksApi'
import { pushGtmEvent } from '@/utils/gtm'
import { BookmarksFiltersPanel } from './BookmarksFiltersPanel'
import { countActiveBookmarkFilters } from './bookmarksFilterSearch'
import type { BookmarkFilters } from './bookmarksFilterConfig'
import type { BookmarkTab } from './bookmarksConfig'

const OPTIONS_STALE_MS = 30 * 60 * 1000 // 30 minutes

const EMPTY_OPTIONS = {
  categories: [],
  modules: [],
  statuses: [],
  priorities: [],
}

export interface BookmarksFilterDrawerProps {
  tab: BookmarkTab
  filters: BookmarkFilters
  onApply: (next: BookmarkFilters) => void
}

/**
 * Filter trigger + right-side drawer for the bookmarks listing. Options are
 * loaded per tab from the user's own bookmarks. The commit is deferred until
 * the drawer close animation finishes (via `onClosed`) so the list doesn't
 * flash a refetch behind the closing panel.
 */
export function BookmarksFilterDrawer({
  tab,
  filters,
  onApply,
}: BookmarksFilterDrawerProps) {
  const [open, setOpen] = useState(false)
  const pendingRef = useRef<BookmarkFilters | null>(null)
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clear any pending fallback timer on unmount.
  useEffect(
    () => () => {
      if (fallbackRef.current) clearTimeout(fallbackRef.current)
    },
    [],
  )

  const { data } = useQuery({
    queryKey: ['bookmark-filter-options', tab],
    queryFn: () => fetchBookmarkFilterOptions(tab),
    staleTime: OPTIONS_STALE_MS,
  })

  const activeCount = countActiveBookmarkFilters(filters)

  function flushPending() {
    if (fallbackRef.current) {
      clearTimeout(fallbackRef.current)
      fallbackRef.current = null
    }
    if (pendingRef.current) {
      const pending = pendingRef.current
      pendingRef.current = null
      onApply(pending)
    }
  }

  function handleApply(next: BookmarkFilters) {
    pushGtmEvent('l_bookmarks_filter_apply', {
      tab,
      count: countActiveBookmarkFilters(next),
    })
    pendingRef.current = next
    setOpen(false)
    // Safety net: commit even if the drawer's close animation never reports done.
    if (fallbackRef.current) clearTimeout(fallbackRef.current)
    fallbackRef.current = setTimeout(flushPending, 600)
  }

  return (
    <>
      <button
        type="button"
        data-testid="bookmarks-filter-trigger"
        onClick={() => setOpen(true)}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-surface text-foreground-muted transition-colors hover:bg-surface-muted hover:-translate-y-px active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 cursor-pointer"
        aria-label="Filter bookmarks"
      >
        <SlidersHorizontal size={16} />
        {activeCount > 0 ? (
          <span
            data-testid="bookmarks-filter-count"
            className="absolute -right-1.5 -top-1.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-brand px-1 py-0.5 type-caption font-semibold text-brand-foreground animate-dash-pop"
          >
            {activeCount > 99 ? '99+' : activeCount}
          </span>
        ) : null}
      </button>

      <MasaiDrawer
        isOpen={open}
        onOpenChange={setOpen}
        onClosed={flushPending}
        direction="right"
        sideMarginInPx={16}
        title="Filters"
        content={
          <BookmarksFiltersPanel
            tab={tab}
            filtersOpen={open}
            options={data ?? EMPTY_OPTIONS}
            selectedFilters={filters}
            onApply={handleApply}
          />
        }
      />
    </>
  )
}
