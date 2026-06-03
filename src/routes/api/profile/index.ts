import { createFileRoute } from '@tanstack/react-router'
import { handleGetProfile } from '@/server/api/profile/handlers/getProfile.handler'
import { handleUpdateProfile } from '@/server/api/profile/handlers/updateProfile.handler'
import { handleChangePassword } from '@/server/api/profile/handlers/changePassword.handler'

export const Route = createFileRoute('/api/profile/')({
  server: {
    handlers: {
      GET: ({ request }) => handleGetProfile(request),
      PATCH: ({ request }) => handleUpdateProfile(request),
      POST: ({ request }) => handleChangePassword(request),
    },
  },
})
