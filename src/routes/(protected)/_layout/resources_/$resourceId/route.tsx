import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/(protected)/_layout/resources_/$resourceId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { resourceId } = Route.useParams()

  return (
    <div className="p-6">
      <p className="type-b1-md">Resource ID: {resourceId}</p>
    </div>
  )
}
