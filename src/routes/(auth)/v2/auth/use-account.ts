import { eq } from 'drizzle-orm'
import { createFileRoute } from '@tanstack/react-router'
import { db } from '@/db'
import { sessions, users } from '@/db/schema'
import { getCurrentSessionPayload } from '@/server/auth/getCurrentSessionUserId'
import {
  errorResponse,
  jsonResponse,
  readJsonBody,
  withAuthErrorHandling,
} from '@/server/auth/v2/httpHelpers'
import {
  buildSessionCookieHeader,
  signSessionToken,
  type SessionTokenPayload,
} from '@/server/auth/v2/sessionToken'

type UseAccountBody = {
  sessionId?: unknown
  rememberMe?: unknown
}

export async function handleUseAccount(request: Request): Promise<Response> {
  const currentPayload = getCurrentSessionPayload()
  if (!currentPayload) {
    return errorResponse(401, 'UNAUTHENTICATED', 'Not signed in')
  }

  const body = await readJsonBody<UseAccountBody>(request)

  const targetSessionId =
    typeof body.sessionId === 'string' ? body.sessionId : ''
  if (!targetSessionId) {
    return errorResponse(400, 'MISSING_FIELDS', 'sessionId is required')
  }

  // Authorization is purely token-based: the signed token is the sole record
  // of which accounts this browser is linked to, so a target the token
  // doesn't already vouch for is rejected outright.
  const existingEntry = currentPayload.sessions.find(
    (s) => s.sessionId === targetSessionId,
  )
  if (!existingEntry) {
    return errorResponse(
      403,
      'FORBIDDEN_ACCOUNT',
      'Target account is not linked to the current session',
    )
  }

  const targetRows = await db
    .select({ id: sessions.id, userId: sessions.userId })
    .from(sessions)
    .where(eq(sessions.id, targetSessionId))
    .limit(1)

  const targetSession = targetRows[0]
  if (!targetSession || targetSession.userId == null) {
    return errorResponse(
      404,
      'SESSION_NOT_FOUND',
      'Target session no longer exists',
    )
  }

  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      mobile: users.mobile,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, targetSession.userId))
    .limit(1)

  const user = userRows[0]
  if (!user) {
    return errorResponse(404, 'USER_NOT_FOUND', 'Target user no longer exists')
  }

  const now = Math.floor(Date.now() / 1000)

  // Switching is not a re-authentication event: an already-known linked
  // account keeps whatever expiry it already had (never extended just by
  // being switched to). If that's already lapsed, the target must sign in
  // again rather than silently riding on the current session's trust.
  if (existingEntry.exp <= now) {
    return errorResponse(
      401,
      'SESSION_EXPIRED',
      'This account was signed out. Please sign in again.',
    )
  }

  const newPayload: SessionTokenPayload = {
    sessionId: targetSessionId,
    sessions: currentPayload.sessions,
  }

  const token = signSessionToken(newPayload)
  const setCookieHeader = buildSessionCookieHeader({
    token,
    request,
    expiresAt: new Date(existingEntry.exp * 1000),
  })

  return jsonResponse(
    { user, token },
    { status: 200, headers: { 'Set-Cookie': setCookieHeader } },
  )
}

export const Route = createFileRoute('/(auth)/v2/auth/use-account')({
  server: {
    handlers: {
      POST: withAuthErrorHandling('use-account', handleUseAccount),
    },
  },
})
