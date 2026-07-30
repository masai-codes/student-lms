import { Link } from '@tanstack/react-router'
import type { AnnouncementItem } from '@/server/api/announcement/getAnnouncements.service'
import {
  formatTimestampLocal,
  formatTimestampIST,
} from '@/utils/timeZoneHandler'

const CRITICAL_ICON_FILTER =
  'invert(17%) sepia(99%) saturate(7473%) hue-rotate(1deg) brightness(103%) contrast(114%)'

export function AnnouncementCard({ item }: { item: AnnouncementItem }) {
  const isMessage = item.source === 'm'
  return (
    <Link
      to={isMessage ? '/messages/$id' : '/announcements/$id'}
      params={{ id: item.id }}
      data-testid={`announcements-item-${item.source}-${item.id}`}
      className={`dash-lift p-[10px] md:p-[12px] rounded-[8px] flex items-center gap-[10px] border bg-surface transition-shadow shadow-sm hover:shadow-md hover:border-[#4F6BED]/35 cursor-pointer no-underline ${item.isForYou ? 'border-[#fad1e8]' : 'border-border'}`}
    >
      {/* Icon — hidden on mobile; red tint for critical announcements */}
      <div className="hidden md:block shrink-0 self-start mt-0.5">
        <img
          src="/AnnouncementIcon.svg"
          alt=""
          className="size-8"
          style={
            item.type === 'critical'
              ? { filter: CRITICAL_ICON_FILTER }
              : undefined
          }
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Title */}
        <h5
          className="text-left text-[14px] md:text-[16px] font-[500] font-poppins cursor-pointer break-words text-foreground leading-snug"
          style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
        >
          {item.title}
        </h5>

        {/* Meta row */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="truncate text-foreground-muted text-[14px] font-[400] font-poppins leading-[16px] md:max-w-[50ch] max-w-[15ch]">
            {item.authorName}
          </span>
          <span className="size-1 rounded-full bg-gray-400 shrink-0" />
          {/* Date — local TZ displayed, IST in tooltip (same pattern as ScheduleCard) */}
          <span className="relative group/date cursor-default text-foreground-muted text-[14px] font-[400] font-inter leading-[16px]">
            {formatTimestampLocal(item.createdAt)}
            <span
              className="pointer-events-none absolute bottom-full left-0 mb-1.5 z-20
              opacity-0 group-hover/date:opacity-100 transition-opacity duration-150
              whitespace-nowrap rounded-md bg-foreground px-2.5 py-1.5
              text-xs font-medium text-background shadow-lg"
            >
              {formatTimestampIST(item.createdAt)}
              <span className="absolute top-full left-4 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
            </span>
          </span>
        </div>
      </div>

      {/* Right — unread dot + For You badge */}
      {(item.isUnread || item.isForYou) && (
        <div className="shrink-0 flex items-center gap-2 ml-4">
          {item.isUnread && <span className="size-2 rounded-full bg-danger" />}
          {item.isForYou && (
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-info-subtle text-info text-sm font-semibold">
              For you
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
