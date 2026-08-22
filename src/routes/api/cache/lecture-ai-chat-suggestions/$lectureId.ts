import { createFileRoute } from '@tanstack/react-router'

import { handleGetCachedLectureAiChatSuggestions } from '@/server/api/cache/handlers/getLectureAiChatSuggestions.handler'

export const Route = createFileRoute(
  '/api/cache/lecture-ai-chat-suggestions/$lectureId',
)({
  server: {
    handlers: {
      GET: ({ params }) =>
        handleGetCachedLectureAiChatSuggestions(params.lectureId),
    },
  },
})
