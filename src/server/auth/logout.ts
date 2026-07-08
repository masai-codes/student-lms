import { createServerFn } from '@tanstack/react-start'
import { deleteCookie } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { sessions } from '@/db/schema'
import { getCurrentUserSessionId } from '@/server/auth/getCurrentSessionUserId'
import { getCookieName } from '@/server/auth/v2/sessionConfig'

/**
 * Ends the current LMS session: removes the row from `sessions` and clears the session cookie.
 * Client should then redirect (e.g. to legacy student UI).
 */
export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  const sessionId = getCurrentUserSessionId()

  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId))
  }

  deleteCookie(getCookieName(), { path: '/' })

  return { ok: true as const }
})
