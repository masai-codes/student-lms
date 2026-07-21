import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { AnnouncementDetailPage } from '@/components/features/announcements/AnnouncementDetailPage'
import { getAnnouncementById } from '@/server/api/announcement/getAnnouncementById.service'
import { getCurrentUserId } from '@/server/auth/getCurrentSessionUserId'

const fetchAnnouncementDetail = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    const userId = await getCurrentUserId()
    if (!userId) throw new Error('UNAUTHORIZED')
    const detail = await getAnnouncementById(userId, data.id, 'a')
    if (!detail) throw new Error('NOT_FOUND')
    return detail
  })

export const Route = createFileRoute('/(protected)/_layout/announcements_/$id')(
  {
    component: RouteComponent,
    loader: async ({ params }) => {
      const id = parseInt(params.id, 10)
      if (!Number.isFinite(id) || id <= 0) throw notFound()

      try {
        return await fetchAnnouncementDetail({ data: { id } })
      } catch {
        throw notFound()
      }
    },
  },
)

function RouteComponent() {
  const detail = Route.useLoaderData()
  return <AnnouncementDetailPage detail={detail} />
}
