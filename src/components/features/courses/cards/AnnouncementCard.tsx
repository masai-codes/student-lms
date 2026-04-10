import { useNavigate } from '@tanstack/react-router'
import type { AnnouncementsType } from '@/server/announcements/fetchAllAnnouncement'
import { formatSqlDate } from '@/utils/generics'

export function AnnouncementCard({ announcement }: { announcement: AnnouncementsType }) {


  const navigate = useNavigate()

  const handleClick = () => {

    navigate({
      to: "/courses/$courseId/announcements/$announcementId",
      params: { courseId: JSON.stringify(announcement.batchId), announcementId: JSON.stringify(announcement.id) },
    })
  }


  return (
    <div onClick={handleClick} className="block">
      <div className="flex items-start gap-2 bg-white border border-[#E5E7EB] rounded-lg p-3">
        <img
          className="mt-[0.25em] h-8 px-2 shrink-0"
          src="/AnnouncementIcon.svg"
          alt="announcement-icon"
        />

        <div className="min-w-0 flex-1">
          <p className="text-lg font-medium truncate">
            {announcement.subject}
          </p>

          <div className="flex items-center gap-2 text-sm font-medium mt-2">
            <p className="text-[#4B5563]">Prof. Anvesh Jain</p>
            <p className="text-[#4B5563]">&bull;</p>
            <p className="text-[#4B5563]">
              {formatSqlDate(announcement.schedule)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
