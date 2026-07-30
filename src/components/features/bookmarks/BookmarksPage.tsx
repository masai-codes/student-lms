import { Link, getRouteApi, useNavigate } from '@tanstack/react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { BOOKMARKS_PER_PAGE, BOOKMARK_TABS } from './bookmarksConfig'
import type { BookmarkTab } from './bookmarksConfig'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { MasaiInput } from '@/components/ui/masai-input'
import AppPagination from '@/components/common/Pagination'
import { fetchBookmarks } from '@/lib/api/bookmarks/bookmarksApi'
import { BookmarkCard } from './BookmarkCard'
import { BookmarkListSkeleton, BookmarksEmptyState } from './BookmarkListStates'
import { BookmarksFilterDrawer } from './BookmarksFilterDrawer'
import { BookmarksAppliedFilters } from './BookmarksAppliedFilters'
import { filtersFromSearch, searchFromFilters } from './bookmarksFilterSearch'
import type { BookmarkFilters } from './bookmarksFilterConfig'

const STALE_TIME_MS = 5 * 60 * 1000

const routeApi = getRouteApi('/(protected)/_layout/bookmarks/')

export function BookmarksPage() {
  const search = routeApi.useSearch()
  const { tab, page, q } = search
  const navigate = useNavigate()

  const activeTab: BookmarkTab = tab ?? 'lectures'
  const filters = filtersFromSearch(search)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      'bookmarks',
      activeTab,
      page,
      q ?? '',
      searchFromFilters(filters),
    ],
    queryFn: () =>
      fetchBookmarks({
        tab: activeTab,
        page,
        limit: BOOKMARKS_PER_PAGE,
        q,
        filters,
      }),
    staleTime: STALE_TIME_MS,
    placeholderData: keepPreviousData,
  })

  const bookmarks = data?.bookmarks ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / BOOKMARKS_PER_PAGE))
  const safePage = Math.min(page, totalPages)

  // Tab switch is a fresh view: reset search + all filters (page 1).
  function handleTabChange(newTab: BookmarkTab) {
    void navigate({ to: '/bookmarks', search: { tab: newTab, page: 1 } })
  }

  function handleSearch(value: string) {
    void navigate({
      to: '/bookmarks',
      search: {
        ...searchFromFilters(filters),
        tab: activeTab,
        page: 1,
        q: value || undefined,
      },
    })
  }

  function handlePageChange(newPage: number) {
    void navigate({
      to: '/bookmarks',
      search: {
        ...searchFromFilters(filters),
        tab: activeTab,
        page: newPage,
        q,
      },
    })
  }

  function applyFilters(next: BookmarkFilters) {
    void navigate({
      to: '/bookmarks',
      search: { ...searchFromFilters(next), tab: activeTab, page: 1, q },
    })
  }

  return (
    <div className="mx-4 mb-6 mt-4 md:mx-8 flex flex-col gap-4">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link
                to="/"
                className="text-sm text-foreground-muted hover:text-foreground"
              >
                Home
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-sm text-foreground font-medium">
              Bookmarks
            </span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-bold text-foreground">Bookmarks</h1>

      {/* Tabs row + search/filter */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {BOOKMARK_TABS.map((t) => {
            const isActive = activeTab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTabChange(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 cursor-pointer ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 border-primary-200'
                    : 'bg-surface text-foreground border-border hover:bg-surface-muted'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <MasaiInput
            placeholder="Search All Bookmarks"
            value={q ?? ''}
            onChange={(e) => handleSearch(e.target.value)}
            iconLeft={<Search size={15} className="text-foreground-subtle" />}
            className="w-64"
          />
          <BookmarksFilterDrawer
            tab={activeTab}
            filters={filters}
            onApply={applyFilters}
          />
        </div>
      </div>

      {/* Applied filter chips */}
      <BookmarksAppliedFilters
        filters={filters}
        onChange={applyFilters}
        onClearAll={() =>
          void navigate({
            to: '/bookmarks',
            search: { tab: activeTab, page: 1, q },
          })
        }
      />

      {/* Content area */}
      <div
        className={`rounded-2xl border border-border bg-surface p-6 flex flex-col gap-5 transition-opacity ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}
      >
        {isLoading ? (
          <BookmarkListSkeleton />
        ) : bookmarks.length > 0 ? (
          <>
            <div className="flex flex-col gap-2.5">
              {bookmarks.map((item) => (
                <BookmarkCard key={item.id} item={item} />
              ))}
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
          </>
        ) : (
          <BookmarksEmptyState />
        )}
      </div>
    </div>
  )
}
