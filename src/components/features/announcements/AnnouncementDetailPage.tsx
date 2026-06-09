import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Bookmark } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import type { AnnouncementDetail } from '@/server/api/announcement/getAnnouncementById.service'
import { markAnnouncementRead, markAnnouncementUnread, addBookmark, removeBookmark } from '@/lib/api/announcement/announcementApi'
import { toast } from '@/lib/toast'
import { formatTimestampLocal, formatTimestampIST } from '@/components/features/dashboard/shared/scheduleUtils'

interface AnnouncementDetailPageProps {
  detail: AnnouncementDetail
}

export function AnnouncementDetailPage({ detail }: AnnouncementDetailPageProps) {
  const [isUnread, setIsUnread] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(detail.isBookmarked)
  const [bookmarkId, setBookmarkId] = useState<number | null>(detail.bookmarkId)
  const markedReadRef = useRef(false)
  const queryClient = useQueryClient()

  const numericId = parseInt(detail.id, 10)
  const source = detail.source

  // ── Auto-mark as read once on load + show toast + bust list cache ─────────
  useEffect(() => {
    if (markedReadRef.current || !Number.isFinite(numericId)) return
    markedReadRef.current = true
    markAnnouncementRead(numericId, source)
      .then(() => {
        toast.success('Marked as read')
        void queryClient.invalidateQueries({ queryKey: ['announcements'] })
      })
      .catch(() => {
        // silent — read-tracking failure is non-critical
      })
  }, [numericId, source, queryClient])

  // ── Toggle mark as read / unread ──────────────────────────────────────────
  async function handleToggleUnread() {
    if (!Number.isFinite(numericId)) return
    try {
      if (isUnread) {
        await markAnnouncementRead(numericId, source)
        setIsUnread(false)
        toast.success('Marked as read')
      } else {
        await markAnnouncementUnread(numericId, source)
        setIsUnread(true)
        toast.success('Marked as unread')
      }
      void queryClient.invalidateQueries({ queryKey: ['announcements'] })
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  // ── Toggle bookmark ───────────────────────────────────────────────────────
  async function handleToggleBookmark() {
    try {
      if (isBookmarked && bookmarkId != null) {
        await removeBookmark(bookmarkId)
        setIsBookmarked(false)
        setBookmarkId(null)
        toast.success('Bookmark removed successfully')
      } else {
        const newBookmarkId = await addBookmark(numericId)
        setIsBookmarked(true)
        setBookmarkId(newBookmarkId)
        toast.success('Bookmark added successfully')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    }
  }

  const breadcrumbTitle =
    detail.title.length > 30 ? `${detail.title.slice(0, 30)}…` : detail.title

  return (
    <div className="mx-4 mb-6 mt-4 md:mx-8 flex flex-col gap-5">

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
            <BreadcrumbLink asChild>
              <Link
                to="/announcements"
                search={{ page: 1 }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Announcements
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-sm text-gray-500">{breadcrumbTitle}</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header row: title/meta + actions */}
      <div className="flex items-start justify-between gap-6">
        {/* Left: title + meta */}
        <div className="flex flex-col gap-1.5 min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 leading-snug break-words">
            {detail.title}
          </h1>
          <div className="flex flex-wrap items-center gap-1.5 text-sm text-gray-500">
            <span className="font-medium text-gray-700">{detail.authorName}</span>
            {detail.scheduledAt && (
              <>
                <span>•</span>
                <span className="relative group/date cursor-default">
                  {formatTimestampLocal(detail.scheduledAt)}
                  <span className="pointer-events-none absolute bottom-full left-0 mb-1.5 z-20
                    opacity-0 group-hover/date:opacity-100 transition-opacity duration-150
                    whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5
                    text-xs font-medium text-white shadow-lg">
                    {formatTimestampIST(detail.scheduledAt)}
                    <span className="absolute top-full left-4 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </span>
                </span>
              </>
            )}
            {detail.category && (
              <>
                <span>•</span>
                <span>{detail.category}</span>
              </>
            )}
            {detail.tags && (
              <>
                <span>•</span>
                <span>{detail.tags}</span>
              </>
            )}
            {detail.type && (
              <>
                <span>•</span>
                <span className="capitalize">{detail.type}</span>
              </>
            )}
          </div>
        </div>

        {/* Right: bookmark + mark as read/unread */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <button
            type="button"
            onClick={() => { void handleToggleBookmark() }}
            className={`flex items-center justify-center w-9 h-9 rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 cursor-pointer ${
              isBookmarked
                ? 'border-primary-300 bg-primary-50 text-primary-600'
                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
            }`}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
          >
            <Bookmark size={16} strokeWidth={1.75} className={isBookmarked ? 'fill-primary-500' : ''} />
          </button>

          <button
            type="button"
            onClick={() => { void handleToggleUnread() }}
            className="text-sm font-medium text-gray-700 px-3 py-1.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 cursor-pointer whitespace-nowrap"
          >
            {isUnread ? 'Mark As Read' : 'Mark As Unread'}
          </button>
        </div>
      </div>

      {/* Body content card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
        <div
          className="prose prose-sm md:prose-base max-w-none text-gray-800 leading-relaxed
            prose-a:text-blue-600 prose-a:underline
            prose-p:my-3 prose-ul:my-3 prose-ol:my-3 prose-li:my-1"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: detail.body }}
        />
      </div>

    </div>
  )
}
