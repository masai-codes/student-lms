import { createFileRoute } from '@tanstack/react-router'
import ClubGalleryPage from '@/components/features/masaiverse-v2/pages/ClubGalleryPage'

export const Route = createFileRoute(
  '/(protected)/_layout/masaiverse/club/$clubId_/gallery',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { clubId } = Route.useParams()
  return <ClubGalleryPage clubId={clubId} />
}
