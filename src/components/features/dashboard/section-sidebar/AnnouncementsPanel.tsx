import { Link } from '@tanstack/react-router'

export interface AnnouncementItem {
  id: string
  title: string
  authorName: string
  isForYou?: boolean
}

interface AnnouncementsPanelProps {
  announcements: Array<AnnouncementItem>
}

export function AnnouncementsPanel({ announcements }: AnnouncementsPanelProps) {
  return (
    <div className="bg-[#F9FAFB] rounded-[16px] border border-gray-200 p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="type-b1-md font-semibold text-gray-900">Announcements</h3>
        <Link
          to="/announcements"
          search={{ page: 1 }}
          className="text-sm font-medium text-[#6962AC] hover:underline focus-visible:outline-none"
        >
          View All
        </Link>
      </div>

      <div className="flex flex-col gap-2 px-0.5 py-0.5 -mx-0.5 -my-0.5">
        {announcements.map((item) => (
          <Link
            key={item.id}
            to={item.isForYou ? '/messages/$id' : '/announcements/$id'}
            params={{ id: item.id }}
            className="rounded-[8px] border border-gray-200 bg-white px-3 py-2.5 flex flex-col gap-1 shadow-sm hover:shadow-md hover:border-gray-300 transition-all focus-visible:outline-none"
          >
            <p className="type-b2-md font-medium text-gray-800 truncate">{item.title}</p>
            <div className="flex items-center gap-2">
              <span className="type-t1 text-gray-500 truncate">{item.authorName}</span>
              {item.isForYou ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-500 text-[11px] font-semibold shrink-0">
                  For You
                </span>
              ) : null}
            </div>
          </Link>
        ))}

        {announcements.length === 0 ? (
          <p className="type-t1 text-gray-400 text-center py-2">No announcements yet.</p>
        ) : null}
      </div>
    </div>
  )
}
