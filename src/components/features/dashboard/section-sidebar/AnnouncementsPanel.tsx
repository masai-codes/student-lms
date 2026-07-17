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

  // When the fetch succeeded with no announcements we keep the card and show a
  // "No announcements yet" body (the parent moves this empty card to the bottom
  // of the sidebar). Loading / error still render their own states.
  const isEmpty = !isLoading && !isError && announcements.length === 0

  return (
    <SidebarPanel
      title="Announcements"
      testId="dashboard-announcements-panel"
      action={
        <SidebarPanelLink
          label="View All"
          testId="dashboard-announcements-view-all"
          onClick={() => {
            pushDashboardEvent('l_dashboard_announcements_view_all')
            void navigate({ to: '/announcements', search: { page: 1 } })
          }}
        />
      }
      isLoading={isLoading}
      isError={isError}
      isEmpty={isEmpty}
      emptyText="No announcements yet"
    >
      <div className="flex max-h-72 flex-col gap-3 overflow-y-auto">
        {announcements.map((announcement, index) => (
          <AnnouncementRow
            key={`${announcement.source}-${announcement.id}`}
            announcement={announcement}
            index={index}
          />
        ))}
      </div>
    </SidebarPanel>
  )
}

function AnnouncementRow({
  announcement,
  index,
}: {
  announcement: DashboardAnnouncement
  index: number
}) {
  const isMessage = announcement.source === 'm'

  return (
    <Link
      style={{ '--dash-delay': `${index * 0.05}s` } as React.CSSProperties}
      to={isMessage ? '/messages/$id' : '/announcements/$id'}
      params={{ id: String(announcement.id) }}
      onClick={() => {
        pushDashboardEvent(
          'l_dashboard_announcement_click_id_' + announcement.id,
          {
            announcement_id: announcement.id,
            source: announcement.source,
            is_message: isMessage,
            title: announcement.title,
          },
        )
      }}
      data-testid={`dashboard-announcement-item-${announcement.source}-${announcement.id}`}
      className="dash-lift animate-dash-row-in rounded-xl border border-border p-3.5 no-underline hover:border-[#4F6BED]/35"
    >
      <h4 className="truncate text-sm font-semibold text-foreground">
        {announcement.title}
      </h4>
      <div className="mt-1.5 flex items-center gap-2">
        {announcement.authorName && (
          <span className="truncate text-xs text-foreground-muted">
            {announcement.authorName}
          </span>
        )}
        {announcement.isForYou && (
          <span
            data-testid="dashboard-announcement-for-you"
            className="rounded-md bg-[#EBF5FF] px-2 py-0.5 text-xs font-semibold text-[#3F83F8] dark:bg-info-subtle dark:text-info-subtle-foreground"
          >
            For you
          </span>
        )}
      </div>
    </Link>
  )
}
