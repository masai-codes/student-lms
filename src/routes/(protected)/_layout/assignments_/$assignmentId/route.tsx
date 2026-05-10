import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/(protected)/_layout/assignments_/$assignmentId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { assignmentId } = Route.useParams()

  return (
    <div className="p-6">
      <p className="type-b1-md">Assignment ID: {assignmentId}</p>
    </div>
  )
}
