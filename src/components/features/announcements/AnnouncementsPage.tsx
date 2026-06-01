import { Search, SlidersHorizontal } from 'lucide-react'
import { getRouteApi, useNavigate, Link } from '@tanstack/react-router'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { MasaiInput } from '@/components/ui/masai-input'
import AppPagination from '@/components/common/Pagination'
import { fetchAnnouncements } from '@/lib/api/announcement/announcementApi'
import { ANNOUNCEMENTS_PER_PAGE } from './announcementsConfig'
import type { AnnouncementItem } from '@/server/api/announcement/getAnnouncements.service'

const STALE_TIME_MS = 5 * 60 * 1000 // 5 minutes

const routeApi = getRouteApi('/(protected)/_layout/announcements/')

// ── Announcement Card ──────────────────────────────────────────────────────────

function AnnouncementCard({ item }: { item: AnnouncementItem }) {
  return (
    <Link
      to="/announcements/$id"
      params={{ id: item.id }}
      className="p-[10px] md:p-[12px] rounded-[8px] flex gap-[10px] border border-[#E5E7EB] bg-white transition-shadow shadow-sm hover:shadow-md cursor-pointer no-underline"
    >
      {/* Icon — hidden on mobile */}
      <div className="hidden md:block shrink-0 self-start mt-0.5">
        <img src="/AnnouncementIcon.svg" alt="" className="size-8" />
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className="min-w-0 flex-1">
          {/* Title */}
          <h5
            className="text-left text-[14px] md:text-[16px] font-[500] font-poppins cursor-pointer break-words text-gray-900 leading-snug"
            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
          >
            {item.title}
          </h5>

          {/* Meta row */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {/* Author */}
            <span className="truncate text-gray-600 text-[14px] font-[400] font-poppins leading-[16px] md:max-w-[50ch] max-w-[15ch]">
              {item.authorName}
            </span>

            {/* Dot separator */}
            <span className="size-1 rounded-full bg-gray-400 shrink-0" />

            {/* Date */}
            <span className="text-gray-600 text-[14px] font-[400] font-inter leading-[16px]">
              {item.date}
            </span>

            {/* For You badge */}
            {item.isForYou && (
              <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 text-[11px] font-semibold">
                For You
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function AnnouncementsPage() {
  const { q, page } = routeApi.useSearch()
  const navigate = useNavigate()

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['announcements', { page, q: q ?? '' }],
    queryFn: () =>
      fetchAnnouncements({ page, limit: ANNOUNCEMENTS_PER_PAGE, q }),
    staleTime: STALE_TIME_MS,
    placeholderData: keepPreviousData,
  })

  const announcements = data?.announcements ?? []
  const total = data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / ANNOUNCEMENTS_PER_PAGE))
  const safePage = Math.min(page, totalPages)

  function handleSearch(value: string) {
    void navigate({
      to: '/announcements',
      search: value ? { q: value, page: 1 } : { page: 1 },
    })
  }

  function handlePageChange(newPage: number) {
    void navigate({
      to: '/announcements',
      search: q ? { q, page: newPage } : { page: newPage },
    })
  }

  return (
    <div className="mx-4 mb-6 mt-4 md:mx-8 flex flex-col gap-4">

      {/* Header row — outside the white card */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900 shrink-0">Announcements</h1>
        <div className="flex items-center gap-2 shrink-0">
          <MasaiInput
            placeholder="Search…"
            value={q ?? ''}
            onChange={(e) => handleSearch(e.target.value)}
            iconLeft={<Search size={15} className="text-gray-400" />}
            className="w-[28rem]"
          />
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            <SlidersHorizontal size={15} className="text-gray-500" />
            Filter
          </button>
        </div>
      </div>

      {/* White card — card list + pagination */}
      <div className={`rounded-2xl border border-gray-200 bg-white p-6 flex flex-col gap-5 transition-opacity ${isFetching && !isLoading ? 'opacity-60' : 'opacity-100'}`}>

        {/* Card list */}
        <div className="flex flex-col gap-2.5">
          {isLoading ? (
            <div className="py-10 text-center text-sm text-gray-400">
              Loading announcements…
            </div>
          ) : announcements.length > 0 ? (
            announcements.map((item) => (
              <AnnouncementCard key={item.id} item={item} />
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center">
              <img
                src="/AnnouncementIconGrey.svg"
                alt=""
                className="mx-auto mb-3 size-10 opacity-50"
              />
              <p className="text-sm text-gray-400">No announcements found.</p>
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
