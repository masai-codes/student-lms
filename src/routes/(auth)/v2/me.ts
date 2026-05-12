import { eq } from 'drizzle-orm'
import { createFileRoute } from '@tanstack/react-router'
import { db } from '@/db'
import { users } from '@/db/schema'
import { getUserIdFromCookieHeader } from '@/server/auth/getCurrentSessionUserId'
import { errorResponse, jsonResponse } from '@/server/auth/v2/httpHelpers'

async function handleMe(request: Request): Promise<Response> {
  const userId = await getUserIdFromCookieHeader(request.headers.get('cookie'))
  if (!userId) {
    return errorResponse(401, 'UNAUTHENTICATED', 'Not signed in')
  }

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      mobile: users.mobile,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const user = rows[0]
  if (!user) {
    return errorResponse(401, 'UNAUTHENTICATED', 'Session user no longer exists')
  }

  return jsonResponse({ user })
}

export const Route = createFileRoute('/(auth)/v2/me')({
  server: {
    handlers: {
      GET: async ({ request }) => handleMe(request),
    },
  },
})
