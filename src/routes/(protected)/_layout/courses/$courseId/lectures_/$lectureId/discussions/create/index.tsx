import { createFileRoute } from '@tanstack/react-router'
import { CreateDiscussion } from '@/components/features/discussions'
import { Card } from '@/components/ui/card'

export const Route = createFileRoute(
  '/(protected)/_layout/courses/$courseId/lectures_/$lectureId/discussions/create/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Card className="p-6">
      <CreateDiscussion />
    </Card>
  )
}
