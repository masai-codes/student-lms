import { Bookmark, Globe, Ticket } from 'lucide-react'
import type {
  BookmarkEntityType,
  BookmarkItem,
} from '@/server/api/bookmarks/getBookmarks.service'
import {
  formatTimestampLocal,
  formatTimestampIST,
} from '@/utils/timeZoneHandler'

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
    return <Globe size={18} strokeWidth={1.75} className="text-info shrink-0" />
  }
  return (
    <Ticket
      size={18}
      strokeWidth={1.75}
      className="text-foreground-subtle shrink-0"
    />
  )
}

export function BookmarkCard({ item }: { item: BookmarkItem }) {
  return (
    <a
      href={item.ctaUrl}
      data-testid={`bookmarks-item-${item.id}`}
      className="dash-lift flex items-center gap-3 p-4 rounded-xl border border-border bg-surface transition-shadow hover:shadow-md hover:border-[#4F6BED]/35 no-underline"
    >
      <div className="shrink-0">
        <EntityIcon type={item.entityType} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[14px] md:text-[15px] font-[500] font-poppins text-foreground leading-snug break-words">
            {item.title}
          </p>
          {item.isForYou && (
            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-brand-subtle text-brand-subtle-foreground text-[11px] font-semibold">
              For You
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-[13px] text-foreground">
          {item.author && (
            <>
              <span>{item.author}</span>
              <span className="size-1 rounded-full bg-gray-600 shrink-0" />
            </>
          )}
          {/* Time — local TZ on card, IST in tooltip */}
          <span className="relative group/savedAt cursor-default">
            {formatTimestampLocal(item.savedAt)}
            <span
              className="pointer-events-none absolute bottom-full left-0 mb-1.5 z-20
              opacity-0 group-hover/savedAt:opacity-100 transition-opacity duration-150
              whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5
              text-xs font-medium text-background shadow-lg"
            >
              {formatTimestampIST(item.savedAt)}
              <span className="absolute top-full left-4 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
            </span>
          </span>
        </div>
      </div>
      {/* Read-only bookmark badge */}
      <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-info-subtle">
        <Bookmark size={16} className="text-info fill-info" />
      </div>
    </a>
  )
}
