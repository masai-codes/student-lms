import jwt from 'jsonwebtoken'
import { createServerFn } from '@tanstack/react-start'
import { getRequest, setResponseHeader } from '@tanstack/react-start/server'

import { loadUserById } from '@/server/auth/loadUserById'
import { createSessions } from '@/server/auth/v2/createSession'

const JWT_ALGORITHM = 'HS256'

/**
 * Verifies a bootstrap JWT — payload `{ userId }`, signed with `JWT_SECRET_KEY`
 * (issued by experience-api's `/jwt-token/generate`) — and returns the numeric
 * user id. Returns `null` for anything that isn't a valid bootstrap token.
 *
 * Session cookies carry `{ sessionId }`, not `{ userId }`; those are rejected so
 * a stray session token can never be mistaken for a bootstrap token.
 */
function verifyBootstrapUserId(token: string): number | null {
  const secret = process.env.JWT_SECRET_KEY
  if (!token || !secret) return null

  let decoded: Record<string, unknown>
  try {
    decoded = jwt.verify(token, secret, {
      algorithms: [JWT_ALGORITHM],
    }) as Record<string, unknown>
  } catch {
    return null
  }

  // A session token, not a bootstrap token.
  if (decoded.sessionId != null && String(decoded.sessionId).length > 0)
    return null

  const raw = decoded.userId
  if (raw == null || raw === '') return null

  const userId = Number(raw)
  if (!Number.isInteger(userId) || userId <= 0) return null

  return userId
}

/**
 * Auto-login fallback used when there is no session cookie yet but the request
 * carries a `?token=<bootstrapJWT>` (legacy/app redirect hands off a short-lived
 * `{ userId }` token). Verifies the token, creates a fresh LMS session for that
 * user, sets the session cookie so subsequent requests are authenticated, and
 * returns the resolved user.
 *
 * Returns `null` when the token is missing/invalid/expired or the user no longer
 * exists — callers should then treat the request as unauthenticated.
 */
export const bootstrapLoginWithToken = createServerFn({ method: 'GET' })
  .inputValidator((token: unknown): string =>
    typeof token === 'string' ? token : '',
  )
  .handler(async ({ data: token }) => {
    const userId = verifyBootstrapUserId(token)
    if (userId == null) return null

    const user = await loadUserById(userId)
    if (!user) return null

    // Bootstrap tokens don't reference a session, so mint one for this user and
    // persist it as the session cookie (same shape as a normal login).
    const request = getRequest()
    const { setCookieHeader } = await createSessions({
      userIds: [userId],
      request,
      source: 'lms-bootstrap-token',
    })
    setResponseHeader('Set-Cookie', setCookieHeader)

    return user
  })
