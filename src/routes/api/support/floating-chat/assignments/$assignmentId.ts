import { createFileRoute } from '@tanstack/react-router'
import { handleGetAssignmentSupportSnapshot } from '@/server/api/support/handlers/assignmentSupportSnapshot.handler'

/** GET /api/support/floating-chat/assignments/:assignmentId — assignment snapshot for support modal. */
export const Route = createFileRoute('/api/support/floating-chat/assignments/$assignmentId')({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        handleGetAssignmentSupportSnapshot(request, params.assignmentId),
    },
  },
})
