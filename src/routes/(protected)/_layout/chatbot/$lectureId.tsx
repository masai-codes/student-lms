import { createFileRoute } from '@tanstack/react-router'
import { LectureAiChatExperience } from '@/components/features/lecture-ai-chat/LectureAiChatExperience'

export const Route = createFileRoute('/(protected)/_layout/chatbot/$lectureId')({
  component: RouteComponent,
})

function RouteComponent() {
  const { lectureId } = Route.useParams()
  const parsedLectureId = Number(lectureId)
  if (!Number.isInteger(parsedLectureId) || parsedLectureId <= 0) {
    return <div>Invalid lecture id.</div>
  }
  return <LectureAiChatExperience lectureId={parsedLectureId} />
}

