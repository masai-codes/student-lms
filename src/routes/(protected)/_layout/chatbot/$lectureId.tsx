import { createFileRoute } from '@tanstack/react-router'
import { ChatbotExperience } from '@/components/features/chatbot/ChatbotExperience'

export const Route = createFileRoute('/(protected)/_layout/chatbot/$lectureId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { lectureId } = Route.useParams()
  const parsedLectureId = Number(lectureId)
  if (!Number.isInteger(parsedLectureId) || parsedLectureId <= 0) {
    return <div>Invalid lecture id.</div>
  }
  return <ChatbotExperience lectureId={parsedLectureId} />
}

