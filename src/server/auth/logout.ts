import { createServerFn } from '@tanstack/react-start'
import { deleteCookie } from '@tanstack/react-start/server'
import { eq } from 'drizzle-orm'

import { db } from '@/db'
import { sessions } from '@/db/schema'


import { readSessionIdFromCookie } from '@/server/auth/getCurrentSessionUserId'

const DEFAULT_COOKIE_NAME = 'masai_school_course_session_v3_dev'

/**
 * Ends the current LMS session: removes the row from `sessions` and clears the session cookie.
 * Client should then redirect (e.g. to legacy student UI).
 */
export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  
  const cookieName = process.env.COOKIE_NAME || DEFAULT_COOKIE_NAME
  const sessionId = await readSessionIdFromCookie()

  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId))
  }

  deleteCookie(cookieName, {
    path: '/',
  })

  return { ok: true as const }
})
