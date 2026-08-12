import { createFileRoute } from '@tanstack/react-router'
import { InterviewSessionPage } from '@/components/features/interviews/InterviewSessionPage'

export const Route = createFileRoute(
  '/(protected)/_layout/interviews_/$sessionId',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { sessionId } = Route.useParams()
  return <InterviewSessionPage sessionId={Number(sessionId)} />
}
