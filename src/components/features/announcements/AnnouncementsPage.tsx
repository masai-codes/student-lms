import { Search } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { MasaiInput } from '@/components/ui/masai-input'
import AppPagination from '@/components/common/Pagination'
import { AnnouncementIcon } from '@/components/common/Icon'
import { fetchAnnouncements } from '@/lib/api/announcement/announcementApi'
import { ANNOUNCEMENTS_PER_PAGE } from './announcementsConfig'
import { AnnouncementCard } from './AnnouncementCard'
import { AnnouncementFilterDrawer } from './AnnouncementFilterDrawer'
import { AnnouncementAppliedFilters } from './AnnouncementAppliedFilters'
import {
  filtersFromSearch,
  searchFromFilters,
} from './announcementFilterSearch'
import type { AnnouncementFilters } from './announcementFilterConfig'

const STALE_TIME_MS = 5 * 60 * 1000 // 5 minutes

const routeApi = getRouteApi('/(protected)/_layout/announcements/')

export function AnnouncementsPage() {
  const search = routeApi.useSearch()
  const { q, page, message } = search
  const navigate = useNavigate()
  const messagesOnly = message === true
  const filters = filtersFromSearch(search)

  const [searchInput, setSearchInput] = useState(q ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setSearchInput(q ?? '')
  }, [q])

  const filterSearch = searchFromFilters(filters)

  function handleSearch(value: string) {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void navigate({
        to: '/announcements',
        search: { ...filterSearch, q: value || undefined, page: 1, message },
      })
    }, 300)
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'announcements',
      { page, q: q ?? '', message: messagesOnly, filterSearch },
    ],
    queryFn: () =>
      fetchAnnouncements({
        page,
        limit: ANNOUNCEMENTS_PER_PAGE,
        q,
        message: messagesOnly,
        types: filters.types,
        categories: filters.categories,
        announcedBy: filters.announcedBy,
        startDate: filters.startDate,
        endDate: filters.endDate,
      }),
    staleTime: STALE_TIME_MS,
    placeholderData: keepPreviousData,
  })

  const announcements = data?.announcements ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / ANNOUNCEMENTS_PER_PAGE))
  const safePage = Math.min(page, totalPages)

  function handlePageChange(newPage: number) {
    void navigate({
      to: '/announcements',
      search: { ...filterSearch, q, page: newPage, message },
    })
  }

  function handleMessagesToggle() {
    void navigate({
      to: '/announcements',
      search: {
        ...filterSearch,
        q,
        page: 1,
        message: messagesOnly ? undefined : true,
      },
    })
  }

  function applyFilters(next: AnnouncementFilters) {
    void navigate({
      to: '/announcements',
      search: { ...searchFromFilters(next), q, page: 1, message },
    })
  }

  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-semibold text-foreground shrink-0">
          Announcements
        </h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <MasaiInput
            placeholder="Search Announcements"
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            iconLeft={<Search size={15} className="text-foreground-subtle" />}
            className="w-full min-w-0 sm:w-[20rem] lg:w-[28rem]"
          />
          <AnnouncementFilterDrawer filters={filters} onApply={applyFilters} />
          <button
            type="button"
            onClick={handleMessagesToggle}
            data-testid="announcements-important-toggle"
            className={`w-full sm:w-auto px-4 py-2.5 rounded-md border text-sm font-medium transition-colors hover:-translate-y-px active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
              messagesOnly
                ? 'bg-brand border-brand text-brand-foreground hover:bg-brand'
                : 'bg-surface border-brand text-brand hover:bg-brand/10'
            }`}
          >
            Important for you
          </button>
        </div>
      </div>

      <AnnouncementAppliedFilters
        filters={filters}
        onChange={applyFilters}
        onClearAll={() =>
          void navigate({
            to: '/announcements',
            search: { q, page: 1, message },
          })
        }
      />

      <div
        className={`rounded-2xl border border-border bg-surface p-6 flex flex-col gap-5 transition-opacity ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}
      >
        <div className="flex flex-col gap-2.5">
          {isLoading ? (
            <div className="py-10 text-center text-sm text-foreground-subtle">
              Loading announcements…
            </div>
          ) : announcements.length > 0 ? (
            announcements.map((item) => (
              <AnnouncementCard key={item.id} item={item} />
            ))
          ) : (
            <div
              data-testid="announcements-empty"
              className="rounded-xl border border-dashed border-border px-4 py-10 text-center"
            >
              {/* `text-border-strong` matches the asset's `#D1D5DB` in light;
                  dark lifts to `foreground-subtle` so the placeholder keeps a
                  comparable presence instead of sinking into the near-black. */}
              <AnnouncementIcon className="mx-auto mb-3 size-10 text-border-strong opacity-50 animate-dash-float dark:text-foreground-subtle" />
              <p className="text-sm text-foreground-subtle">
                No announcements found.
              </p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center">
            <AppPagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}
