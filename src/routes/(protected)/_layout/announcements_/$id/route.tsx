import { createFileRoute, notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod' // kept for validateSearch schema
import { AnnouncementDetailPage } from '@/components/features/announcements/AnnouncementDetailPage'
import { getAnnouncementById } from '@/server/api/announcement/getAnnouncementById.service'
import { getCurrentSessionUserId } from '@/server/auth/getCurrentSessionUserId'

const searchSchema = z.object({
  src: z.enum(['a', 'm']).optional().default('a'),
})

const fetchAnnouncementDetail = createServerFn({ method: 'GET' })
  .inputValidator((data: { id: number; src: 'a' | 'm' }) => data)
  .handler(async ({ data }) => {
    const userId = await getCurrentSessionUserId()
    if (!userId) throw new Error('UNAUTHORIZED')
    const detail = await getAnnouncementById(userId, data.id, data.src)
    if (!detail) throw new Error('NOT_FOUND')
    return detail
  })

export const Route = createFileRoute('/(protected)/_layout/announcements_/$id')({
  validateSearch: searchSchema,
  component: RouteComponent,
  loader: async ({ params, location }) => {
    const id = parseInt(params.id, 10)
    if (!Number.isFinite(id) || id <= 0) throw notFound()

    const src: 'a' | 'm' = location.searchStr.includes('src=m') ? 'm' : 'a'

    try {
      return await fetchAnnouncementDetail({ data: { id, src } })
    } catch {
      throw notFound()
    }
  },
})

function RouteComponent() {
  const detail = Route.useLoaderData()
  return <AnnouncementDetailPage detail={detail} />
}
