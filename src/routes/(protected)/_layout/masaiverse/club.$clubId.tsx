import { createFileRoute } from '@tanstack/react-router'
import ClubDetailPage from '@/components/features/masaiverse-v2/pages/ClubDetailPage'

export const Route = createFileRoute(
  '/(protected)/_layout/masaiverse/club/$clubId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { clubId } = Route.useParams()
  return <ClubDetailPage clubId={clubId} />
}
