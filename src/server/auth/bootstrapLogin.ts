import { createServerFn } from '@tanstack/react-start'
import { getRequest, setResponseHeader } from '@tanstack/react-start/server'

import {
  lookupUserIdBySessionId,
  readSessionIdFromToken,
} from '@/server/auth/getCurrentSessionUserId'
import { loadUserById } from '@/server/auth/loadUserById'
import { buildActiveCookieHeader } from '@/server/auth/v2/createSession'

/**
 * Auto-login fallback used when there is no session cookie yet but the request
 * carries a `?token=<sessionJWT>` (legacy/app redirect hands the session off in
 * the URL). Verifies the token, persists it as the session cookie so subsequent
 * requests are authenticated, and returns the resolved user.
 *
 * Returns `null` when the token is missing/invalid or its session no longer
 * exists — callers should then treat the request as unauthenticated.
 */
export const bootstrapLoginWithToken = createServerFn({ method: 'GET' })
  .inputValidator((token: unknown): string =>
    typeof token === 'string' ? token : '',
  )
  .handler(async ({ data: token }) => {
    if (!token) return null

    const sessionId = readSessionIdFromToken(token)
    if (!sessionId) return null

    const userId = await lookupUserIdBySessionId(sessionId)
    if (!userId) return null

    // The token is already a valid signed session JWT, so it doubles as the
    // cookie value — no new session row needed, just persist it for next time.
    const request = getRequest()
    setResponseHeader('Set-Cookie', buildActiveCookieHeader({ token, request }))

    return loadUserById(userId)
  })
