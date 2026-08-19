import { createFileRoute } from '@tanstack/react-router'
import { handleGetStudentKit } from '@/server/api/profile/handlers/profileTabs.handler'

export const Route = createFileRoute('/api/profile/student-kit')({
  server: {
    handlers: {
      GET: () => handleGetStudentKit(),
    },
  },
})
