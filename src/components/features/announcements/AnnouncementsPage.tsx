import { Search } from 'lucide-react'
import { getRouteApi, useNavigate, Link } from '@tanstack/react-router'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { MasaiInput } from '@/components/ui/masai-input'
import AppPagination from '@/components/common/Pagination'
import { fetchAnnouncements } from '@/lib/api/announcement/announcementApi'
import { ANNOUNCEMENTS_PER_PAGE } from './announcementsConfig'
import type { AnnouncementItem } from '@/server/api/announcement/getAnnouncements.service'
import { formatTimestampLocal, formatTimestampIST } from '@/utils/timeZoneHandler'

const STALE_TIME_MS = 5 * 60 * 1000 // 5 minutes

const routeApi = getRouteApi('/(protected)/_layout/announcements/')

// ── Announcement Card ──────────────────────────────────────────────────────────

function AnnouncementCard({ item }: { item: AnnouncementItem }) {
  const isMessage = item.source === 'm'
  return (
    <Link
      to={isMessage ? '/messages/$id' : '/announcements/$id'}
      params={{ id: item.id }}
      className={`p-[10px] md:p-[12px] rounded-[8px] flex items-center gap-[10px] border bg-white transition-shadow shadow-sm hover:shadow-md cursor-pointer no-underline ${item.isForYou ? 'border-[#fad1e8]' : 'border-[#E5E7EB]'}`}
    >
      {/* Icon — hidden on mobile; red tint for critical announcements */}
      <div className="hidden md:block shrink-0 self-start mt-0.5">
        <img
          src="/AnnouncementIcon.svg"
          alt=""
          className="size-8"
          style={item.type === 'critical' ? { filter: 'invert(17%) sepia(99%) saturate(7473%) hue-rotate(1deg) brightness(103%) contrast(114%)' } : undefined}
        />
      </div>

      {/* Content */}
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
          <span className="truncate text-gray-600 text-[14px] font-[400] font-poppins leading-[16px] md:max-w-[50ch] max-w-[15ch]">
            {item.authorName}
          </span>
          <span className="size-1 rounded-full bg-gray-400 shrink-0" />
          {/* Date — local TZ displayed, IST in tooltip (same pattern as ScheduleCard) */}
          <span className="relative group/date cursor-default text-gray-600 text-[14px] font-[400] font-inter leading-[16px]">
            {formatTimestampLocal(item.createdAt)}
            <span className="pointer-events-none absolute bottom-full left-0 mb-1.5 z-20
              opacity-0 group-hover/date:opacity-100 transition-opacity duration-150
              whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5
              text-xs font-medium text-white shadow-lg">
              {formatTimestampIST(item.createdAt)}
              <span className="absolute top-full left-4 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </span>
          </span>
        </div>
      </div>

      {/* Right — unread dot + For You badge */}
      {(item.isUnread || item.isForYou) && (
        <div className="shrink-0 flex items-center gap-2 ml-4">
          {item.isUnread && (
            <span className="size-2 rounded-full bg-[#ED0331]" />
          )}
          {item.isForYou && (
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-[#EBF5FF] text-[#3F83F8] text-sm font-semibold">
              For you
            </span>
          )}
        </div>
      )}
    </Link>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function AnnouncementsPage() {
  const { q, page, message } = routeApi.useSearch()
  const navigate = useNavigate()
  const messagesOnly = message === true

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['announcements', { page, q: q ?? '', message: messagesOnly }],
    queryFn: () =>
      fetchAnnouncements({ page, limit: ANNOUNCEMENTS_PER_PAGE, q, message: messagesOnly }),
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
      search: { q: value || undefined, page: 1, message: message },
    })
  }

  function handlePageChange(newPage: number) {
    void navigate({
      to: '/announcements',
      search: { q, page: newPage, message },
    })
  }

  function handleMessagesToggle() {
    void navigate({
      to: '/announcements',
      search: { q, page: 1, message: messagesOnly ? undefined : true },
    })
  }

  return (
    <div className="mx-4 mb-6 mt-4 md:mx-8 flex flex-col gap-4">

      {/* Header row — outside the white card */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900 shrink-0">Announcements</h1>
        <div className="flex items-center gap-2 shrink-0">
          <MasaiInput
            placeholder="Search Announcements"
            value={q ?? ''}
            onChange={(e) => handleSearch(e.target.value)}
            iconLeft={<Search size={15} className="text-gray-400" />}
            className="w-[28rem]"
          />
          <button
            type="button"
            onClick={handleMessagesToggle}
            className={`px-4 py-2.5 rounded-md border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6962AC] ${
              messagesOnly
                ? 'bg-[#6962AC] border-[#6962AC] text-white hover:bg-[#6962AC]'
                : 'bg-white border-[#6962AC] text-[#6962AC] hover:bg-[#6962AC]/10'
            }`}
          >
            Important for you
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
