import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/(protected)/_layout/lectures_/$lectureId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { lectureId } = Route.useParams()

  return (
    <div className="p-6">
      <p className="type-b1-md">Lecture ID: {lectureId}</p>
    </div>
  )
}
