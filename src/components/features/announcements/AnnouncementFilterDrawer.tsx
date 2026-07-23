import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal } from 'lucide-react'
import { MasaiDrawer } from '@/components/ui/masai-drawer'
import { fetchAnnouncementFilterOptions } from '@/lib/api/announcement/announcementApi'
import { pushGtmEvent } from '@/utils/gtm'
import { AnnouncementFiltersPanel } from './AnnouncementFiltersPanel'
import { countActiveAnnouncementFilters } from './announcementFilterSearch'
import type { AnnouncementFilters } from './announcementFilterConfig'

const OPTIONS_STALE_MS = 30 * 60 * 1000 // 30 minutes

export const ANNOUNCEMENT_FILTER_OPTIONS_KEY = ['announcement-filter-options']

export interface AnnouncementFilterDrawerProps {
  filters: AnnouncementFilters
  onApply: (next: AnnouncementFilters) => void
}

/**
 * Filter trigger + right-side drawer for the announcements listing (Type,
 * Category, Announced by, Announced date). Options are loaded once and cached;
 * the commit is deferred to the drawer close animation to avoid a refetch flash.
 */
export function AnnouncementFilterDrawer({
  filters,
  onApply,
}: AnnouncementFilterDrawerProps) {
  const [open, setOpen] = useState(false)
  const pendingRef = useRef<AnnouncementFilters | null>(null)
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clear any pending fallback timer on unmount.
  useEffect(
    () => () => {
      if (fallbackRef.current) clearTimeout(fallbackRef.current)
    },
    [],
  )

  const { data } = useQuery({
    queryKey: ANNOUNCEMENT_FILTER_OPTIONS_KEY,
    queryFn: fetchAnnouncementFilterOptions,
    staleTime: OPTIONS_STALE_MS,
  })

  const categoryOptions = useMemo(
    () => (data?.categories ?? []).map((c) => ({ value: c, label: c })),
    [data],
  )
  const announcerOptions = useMemo(
    () => (data?.announcers ?? []).map((a) => ({ value: a.id, label: a.name })),
    [data],
  )

  const activeCount = countActiveAnnouncementFilters(filters)

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

  function handleApply(next: AnnouncementFilters) {
    pushGtmEvent('l_announcement_filter_apply', {
      count: countActiveAnnouncementFilters(next),
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
        data-testid="announcements-filter-trigger"
        onClick={() => setOpen(true)}
        aria-label="Filter announcements"
        className="relative flex items-center justify-center px-4 py-2.5 rounded-md border border-brand bg-surface text-brand transition-colors hover:bg-brand/10 hover:-translate-y-px active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        <span className="inline-flex items-center gap-2 text-sm font-medium">
          <SlidersHorizontal size={16} />
          Filters
        </span>
        {activeCount > 0 ? (
          <span
            data-testid="announcements-filter-count"
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
          <AnnouncementFiltersPanel
            filtersOpen={open}
            categoryOptions={categoryOptions}
            announcerOptions={announcerOptions}
            selectedFilters={filters}
            onApply={handleApply}
          />
        }
      />
    </>
  )
}
