import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { MessageDetailPage } from '@/components/features/announcements/MessageDetailPage'
import { getAnnouncementById } from '@/server/api/announcement/getAnnouncementById.service'
import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'

const fetchMessageDetail = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: number }) => data)
  .handler(async ({ data }) => {
    const userId = await getCurrentSessionUserId()
    if (!userId) throw new Error('UNAUTHORIZED')
    const detail = await getAnnouncementById(userId, data.id, 'm')
    if (!detail) throw new Error('NOT_FOUND')
    return detail
  })

export const Route = createFileRoute('/(protected)/_layout/messages_/$id')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const id = parseInt(params.id, 10)
    if (!Number.isFinite(id) || id <= 0) throw notFound()

    try {
      return await fetchMessageDetail({ data: { id } })
    } catch {
      throw notFound()
    }
  },
})

function RouteComponent() {
  const detail = Route.useLoaderData()
  return <MessageDetailPage detail={detail} />
}
