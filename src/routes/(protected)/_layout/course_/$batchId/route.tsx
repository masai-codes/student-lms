import { createFileRoute } from '@tanstack/react-router'
import { CoursePage } from '@/components/features/course/CoursePage'

export const Route = createFileRoute('/(protected)/_layout/course_/$batchId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { batchId } = Route.useParams()
  return <CoursePage batchId={batchId} />
}
