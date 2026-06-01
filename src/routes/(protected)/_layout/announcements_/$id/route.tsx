import { createFileRoute, notFound } from '@tanstack/react-router'
import { AnnouncementDetailPage } from '@/components/features/announcements/AnnouncementDetailPage'
import { fetchAnnouncementById } from '@/lib/api/announcement/announcementApi'

export const Route = createFileRoute('/(protected)/_layout/announcements_/$id')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const id = parseInt(params.id, 10)
    if (!Number.isFinite(id) || id <= 0) throw notFound()

    const detail = await fetchAnnouncementById(id)
    if (!detail) throw notFound()

    return detail
  },
})

function RouteComponent() {
  const detail = Route.useLoaderData()
  return <AnnouncementDetailPage detail={detail} />
}
