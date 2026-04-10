import { createFileRoute } from '@tanstack/react-router'
import { ProfilePage } from '@/components/features/profile'

export const Route = createFileRoute('/(protected)/_layout/profile/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { user } = Route.useRouteContext()
  return (
    <ProfilePage user={user} />
  )
}
