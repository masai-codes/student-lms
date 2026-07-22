import { Search } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { getRouteApi, useNavigate } from '@tanstack/react-router'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { MasaiInput } from '@/components/ui/masai-input'
import AppPagination from '@/components/common/Pagination'
import { fetchAnnouncements } from '@/lib/api/announcement/announcementApi'
import { ANNOUNCEMENTS_PER_PAGE } from './announcementsConfig'
import { AnnouncementCard } from './AnnouncementCard'
import { AnnouncementFilters } from './AnnouncementFilters'

const STALE_TIME_MS = 5 * 60 * 1000 // 5 minutes

const routeApi = getRouteApi('/(protected)/_layout/announcements/')

export function AnnouncementsPage() {
  const { q, page, message, type, category } = routeApi.useSearch()
  const navigate = useNavigate()
  const messagesOnly = message === true
  const types = type ?? []
  const categories = category ?? []

  const [searchInput, setSearchInput] = useState(q ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep local input in sync if q changes externally (e.g. browser back/forward)
  useEffect(() => {
    setSearchInput(q ?? '')
  }, [q])

  function handleSearch(value: string) {
    setSearchInput(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void navigate({
        to: '/announcements',
        search: { q: value || undefined, page: 1, message, type, category },
      })
    }, 300)
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'announcements',
      { page, q: q ?? '', message: messagesOnly, types, categories },
    ],
    queryFn: () =>
      fetchAnnouncements({
        page,
        limit: ANNOUNCEMENTS_PER_PAGE,
        q,
        message: messagesOnly,
        types,
        categories,
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
      search: { q, page: newPage, message, type, category },
    })
  }

  function handleMessagesToggle() {
    void navigate({
      to: '/announcements',
      search: {
        q,
        page: 1,
        message: messagesOnly ? undefined : true,
        type,
        category,
      },
    })
  }

  function handleFiltersChange(next: {
    types: Array<string>
    categories: Array<string>
  }) {
    void navigate({
      to: '/announcements',
      search: {
        q,
        page: 1,
        message,
        type: next.types.length > 0 ? next.types : undefined,
        category: next.categories.length > 0 ? next.categories : undefined,
      },
    })
  }

  return (
    <div className="mx-4 mb-6 mt-4 md:mx-8 flex flex-col gap-4">
      {/* Header row — outside the white card */}
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
          <AnnouncementFilters
            value={{ types, categories }}
            onChange={handleFiltersChange}
          />
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

      {/* White card — card list + pagination */}
      <div
        className={`rounded-2xl border border-border bg-surface p-6 flex flex-col gap-5 transition-opacity ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}
      >
        {/* Card list */}
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
              <img
                src="/AnnouncementIconGrey.svg"
                alt=""
                className="mx-auto mb-3 size-10 opacity-50 animate-dash-float"
              />
              <p className="text-sm text-foreground-subtle">
                No announcements found.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
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
