import { createFileRoute } from '@tanstack/react-router'
import type { AnnouncementsType } from '@/server/announcements/fetchAllAnnouncement'
import { Badge } from "@/components/ui/badge"
import { formatSqlDate } from '@/utils/generics'
import { fetchAnnouncementById } from '@/server/announcements/fetchAnnouncementById'
import { AnnouncementDetails as AnnouncementDetail } from '@/components/features/courses'

export const Route = createFileRoute(
  '/(protected)/_layout/courses/$courseId/announcements_/$announcementId/',
)({
  component: RouteComponent,
  loader: async ({ params }) => {
    const announcementId = Number(params.announcementId)

    const announcementData = await fetchAnnouncementById({
      data: { announcementId },
    })

    return { announcementData }
  }
})

function RouteComponent() {

  const data = Route.useLoaderData();

  const { announcementData } = data


  return (
    <div className='w-full py-6'>

      <AnnouncementDetailHeader
        data={announcementData[0]}
      />

      <AnnouncementDetail data={announcementData[0]} />
      
    </div>
  )
}






interface AnnouncementDetailHeaderProps {
  data: AnnouncementsType
}

export function AnnouncementDetailHeader({
  data,
}: AnnouncementDetailHeaderProps) {
  return (
    <div className="space-y-4 mb-8">
      <h1 className="text-2xl font-bold">
        {data.subject}
      </h1>

      <div className="flex flex-wrap items-center gap-2 text-sm text-[#4B5563]">
        <p>Prof. Anvesh Jain</p>
        <p>&bull;</p>
        <p>{formatSqlDate(data.schedule)}</p>
        <Badge variant="outline" className='bg-white text-[#3F83F8]'>
          For you
        </Badge>

      </div>
    </div>
  )
}



