import { createFileRoute, notFound } from '@tanstack/react-router'
import { WhatsNewDetailPage } from '@/components/features/whats-new/WhatsNewDetailPage'
import { fetchWhatsNewById } from '@/lib/api/whats-new/whatsNewApi'

export const Route = createFileRoute('/(protected)/_layout/whats-new_/$id')({
  component: RouteComponent,
  loader: async ({ params }) => {
    const id = parseInt(params.id, 10)
    if (!Number.isFinite(id) || id <= 0) throw notFound()

    const detail = await fetchWhatsNewById(id)
    if (!detail) throw notFound()

    return detail
  },
})

function RouteComponent() {
  const detail = Route.useLoaderData()
  return <WhatsNewDetailPage detail={detail} />
}
