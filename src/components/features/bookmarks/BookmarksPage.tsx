import { Link, getRouteApi, useNavigate } from '@tanstack/react-router'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Bookmark, Globe, Search, SlidersHorizontal, Ticket } from 'lucide-react'
import { BOOKMARKS_PER_PAGE, BOOKMARK_TABS } from './bookmarksConfig'
import type { BookmarkEntityType, BookmarkItem } from '@/server/api/bookmarks/getBookmarks.service'
import type { BookmarkTab } from './bookmarksConfig'
import { Skeleton } from '@/components/ui/skeleton'
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
import { formatTimestampLocal, formatTimestampIST } from '@/utils/timeZoneHandler'

const STALE_TIME_MS = 5 * 60 * 1000

const routeApi = getRouteApi('/(protected)/_layout/bookmarks/')

// ── Entity icon ────────────────────────────────────────────────────────────────

function EntityIcon({ type }: { type: BookmarkEntityType }) {
  if (type === 'resource') {
    return <img src="/ResourceIcon.svg" alt="" className="size-5 shrink-0" />
  }
  if (type === 'lecture') {
    return <img src="/LectureIcon.svg" alt="" className="size-5 shrink-0" />
  }
  if (type === 'assignment') {
    return <img src="/AssignmentIcon.svg" alt="" className="size-5 shrink-0" />
  }
  if (type === 'announcement') {
    return <img src="/AnnouncementIcon.svg" alt="" className="size-5 shrink-0" />
  }
  if (type === 'masaiverse') {
    return <Globe size={18} strokeWidth={1.75} className="text-indigo-400 shrink-0" />
  }
  // ticket
  return <Ticket size={18} strokeWidth={1.75} className="text-gray-400 shrink-0" />
}

// ── Bookmark Card ──────────────────────────────────────────────────────────────

function BookmarkCard({ item }: { item: BookmarkItem }) {
  const inner = (
    <>
      <div className="shrink-0">
        <EntityIcon type={item.entityType} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[14px] md:text-[15px] font-[500] font-poppins text-gray-900 leading-snug break-words">
            {item.title}
          </p>
          {item.isForYou && (
            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-[11px] font-semibold">
              For You
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-[13px] text-gray-900">
          {item.author && (
            <>
              <span>{item.author}</span>
              <span className="size-1 rounded-full bg-gray-600 shrink-0" />
            </>
          )}
          {/* Time — local TZ on card, IST in tooltip */}
          <span className="relative group/savedAt cursor-default">
            {formatTimestampLocal(item.savedAt)}
            <span className="pointer-events-none absolute bottom-full left-0 mb-1.5 z-20
              opacity-0 group-hover/savedAt:opacity-100 transition-opacity duration-150
              whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5
              text-xs font-medium text-white shadow-lg">
              {formatTimestampIST(item.savedAt)}
              <span className="absolute top-full left-4 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </span>
          </span>
        </div>
      </div>
      {/* Read-only bookmark badge */}
      <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-50">
        <Bookmark size={16} className="text-indigo-500 fill-indigo-500" />
      </div>
    </>
  )

  const cardClass = "flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md no-underline"

  // Masaiverse uses an internal route with search params — use a plain anchor
  if (item.entityType === 'masaiverse') {
    return (
      <a href={item.ctaUrl} className={cardClass}>
        {inner}
      </a>
    )
  }

  return (
    <a href={item.ctaUrl} className={cardClass}>
      {inner}
    </a>
  )
}

// ── Bookmark Card Skeleton ─────────────────────────────────────────────────────

function BookmarkCardSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 bg-white">
      {/* icon */}
      <Skeleton className="mt-0.5 size-5 shrink-0 rounded" />
      <div className="flex-1 min-w-0 space-y-2">
        {/* title row */}
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="h-4 w-[55%] rounded" />
          <Skeleton className="h-4 w-[15%] rounded-full shrink-0" />
        </div>
        {/* subtitle */}
        <Skeleton className="h-3 w-[40%] rounded" />
        {/* meta + saved-at */}
        <Skeleton className="h-3 w-[30%] rounded" />
      </div>
    </div>
  )
}

function BookmarkListSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <BookmarkCardSkeleton key={i} />
      ))}
    </div>
  )
}

// ── Empty State ────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Bookmark size={48} strokeWidth={1} className="text-gray-300" />
      <div className="text-center">
        <p className="text-base font-semibold text-gray-700">No Bookmarks Yet</p>
        <p className="mt-1 text-sm text-gray-400">
          Save lectures, assignments, and resources to find them quickly later.
        </p>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function BookmarksPage() {
  const { tab, page, q } = routeApi.useSearch()
  const navigate = useNavigate()

  const activeTab: BookmarkTab = tab ?? 'lectures'

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['bookmarks', activeTab, page, q ?? ''],
    queryFn: () =>
      fetchBookmarks({ tab: activeTab, page, limit: BOOKMARKS_PER_PAGE, q }),
    staleTime: STALE_TIME_MS,
    placeholderData: keepPreviousData,
  })

  const bookmarks = data?.bookmarks ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / BOOKMARKS_PER_PAGE))
  const safePage = Math.min(page, totalPages)

  function handleTabChange(newTab: BookmarkTab) {
    void navigate({
      to: '/bookmarks',
      search: { tab: newTab, page: 1 },
    })
  }

  function handleSearch(value: string) {
    void navigate({
      to: '/bookmarks',
      search: value
        ? { tab: activeTab, page: 1, q: value }
        : { tab: activeTab, page: 1 },
    })
  }

  function handlePageChange(newPage: number) {
    void navigate({
      to: '/bookmarks',
      search: q
        ? { tab: activeTab, page: newPage, q }
        : { tab: activeTab, page: newPage },
    })
  }

  return (
    <div className="mx-4 mb-6 mt-4 md:mx-8 flex flex-col gap-4">

      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
                Home
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-sm text-gray-900 font-medium">Bookmarks</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page title */}
      <h1 className="text-2xl font-bold text-gray-900">Bookmarks</h1>

      {/* Tabs row + search/filter */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Tabs */}
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
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Search + filter */}
        <div className="flex items-center gap-2 shrink-0">
          <MasaiInput
            placeholder="Search All Bookmarks"
            value={q ?? ''}
            onChange={(e) => handleSearch(e.target.value)}
            iconLeft={<Search size={15} className="text-gray-400" />}
            className="w-64"
          />
          <button
            type="button"
            className="flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 cursor-pointer"
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className={`rounded-2xl border border-gray-200 bg-white p-6 flex flex-col gap-5 transition-opacity ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}>
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
          <EmptyState />
        )}
      </div>

    </div>
  )
}
