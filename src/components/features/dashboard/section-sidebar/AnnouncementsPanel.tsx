import { SidebarPanel, SidebarPanelLink } from './SidebarPanel'
import type { Announcement } from '../shared/types'

interface AnnouncementsPanelProps {
  announcements: Array<Announcement>
}

// Sidebar panel listing recent announcements with an optional "For You" tag.
export function AnnouncementsPanel({ announcements }: AnnouncementsPanelProps) {
  return (
    <SidebarPanel title="Announcements" action={<SidebarPanelLink label="View all" />}>
      {announcements.length === 0 ? (
        <p className="text-sm text-gray-400">No announcements yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {announcements.map((announcement) => (
            <AnnouncementRow key={announcement.id} announcement={announcement} />
          ))}
        </div>
      )}
    </SidebarPanel>
  )
}

function AnnouncementRow({ announcement }: { announcement: Announcement }) {
  return (
    <div className="rounded-xl border border-gray-200 p-3.5 transition-shadow hover:shadow-sm">
      <h4 className="truncate text-sm font-semibold text-gray-900">
        {announcement.title}
      </h4>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="truncate text-xs text-gray-600">{announcement.author}</span>
        {announcement.isForYou && (
          <span className="rounded-md bg-[#EBF5FF] px-2 py-0.5 text-xs font-semibold text-[#3F83F8]">
            For You
          </span>
        )}
      </div>
    </div>
  )
}
