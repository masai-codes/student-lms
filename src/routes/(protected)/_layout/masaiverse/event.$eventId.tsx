import { createFileRoute } from '@tanstack/react-router'
import EventDetailPage from '@/components/features/masaiverse-v2/pages/EventDetailPage'

export const Route = createFileRoute(
  '/(protected)/_layout/masaiverse/event/$eventId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { eventId } = Route.useParams()
  return <EventDetailPage eventId={eventId} />
}
