import { Outlet, createFileRoute } from '@tanstack/react-router'
import MasaiverseHomepage from '@/components/features/masaiverse/MasaiVerseHomepage'

export const Route = createFileRoute('/(protected)/_layout/masaiverse')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <MasaiverseHomepage>
      <Outlet />
    </MasaiverseHomepage>
  )
}
