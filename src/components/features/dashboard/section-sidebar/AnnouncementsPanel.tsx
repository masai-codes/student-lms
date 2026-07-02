import { Link, useNavigate } from '@tanstack/react-router'
import { pushDashboardEvent } from '../shared/dashboardAnalytics'
import { SidebarPanel, SidebarPanelLink } from './SidebarPanel'
import type { DashboardAnnouncement } from '@/server/api/dashboard/announcements/announcementFeed'

interface AnnouncementsPanelProps {
  announcements: Array<DashboardAnnouncement>
  isLoading: boolean
  isError: boolean
}

// Announcements + "For You" messages (merged, newest-first, up to 5). Message
// rows link to the message thread; announcement rows to the announcement detail
// (firing the `l_announcement` GTM event). "View All" opens the full feed.
export function AnnouncementsPanel({
  announcements,
  isLoading,
  isError,
}: AnnouncementsPanelProps) {
  const navigate = useNavigate()

  return (
    <SidebarPanel
      title="Announcements"
      testId="dashboard-announcements-panel"
      action={
        <SidebarPanelLink
          label="View All"
          testId="dashboard-announcements-view-all"
          onClick={() => void navigate({ to: '/announcements', search: { page: 1 } })}
        />
      }
      isLoading={isLoading}
      isError={isError}
      isEmpty={announcements.length === 0}
      emptyText="No announcements yet"
    >
      <div className="flex max-h-72 flex-col gap-3 overflow-y-auto">
        {announcements.map((announcement) => (
          <AnnouncementRow
            key={`${announcement.source}-${announcement.id}`}
            announcement={announcement}
          />
        ))}
      </div>
    </SidebarPanel>
  )
}

function AnnouncementRow({ announcement }: { announcement: DashboardAnnouncement }) {
  const isMessage = announcement.source === 'm'

  return (
    <Link
      to={isMessage ? '/messages/$id' : '/announcements/$id'}
      params={{ id: String(announcement.id) }}
      onClick={() => {
        if (!isMessage) pushDashboardEvent('l_announcement')
      }}
      data-testid={`dashboard-announcement-item-${announcement.source}-${announcement.id}`}
      className="rounded-xl border border-gray-200 p-3.5 no-underline transition-shadow hover:shadow-sm"
    >
      <h4 className="truncate text-sm font-semibold text-gray-900">
        {announcement.title}
      </h4>
      <div className="mt-1.5 flex items-center gap-2">
        {announcement.authorName && (
          <span className="truncate text-xs text-gray-600">{announcement.authorName}</span>
        )}
        {announcement.isForYou && (
          <span
            data-testid="dashboard-announcement-for-you"
            className="rounded-md bg-[#EBF5FF] px-2 py-0.5 text-xs font-semibold text-[#3F83F8]"
          >
            For you
          </span>
        )}
      </div>
    </Link>
  )
}
