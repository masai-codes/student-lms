import { eq } from 'drizzle-orm'
import { createFileRoute } from '@tanstack/react-router'
import { db } from '@/db'
import { sessions, users } from '@/db/schema'
import {
  readSessionIdFromAuthHeader,
  readSessionIdFromCookieHeader,
} from '@/server/auth/getCurrentSessionUserId'
import {
  buildActiveCookieHeader,
  signSessionToken,
} from '@/server/auth/v2/createSession'
import {
  BadRequestError,
  errorResponse,
  jsonResponse,
  readJsonBody,
} from '@/server/auth/v2/httpHelpers'
import { isSessionLinkedTo } from '@/server/auth/v2/linkedAccounts'

type UseAccountBody = {
  sessionId?: unknown
  rememberMe?: unknown
}

function resolveCurrentSessionId(request: Request): string | null {
  return (
    readSessionIdFromAuthHeader(request.headers.get('authorization')) ??
    readSessionIdFromCookieHeader(request.headers.get('cookie'))
  )
}

async function handleUseAccount(request: Request): Promise<Response> {
  const currentSessionId = resolveCurrentSessionId(request)
  if (!currentSessionId) {
    return errorResponse(401, 'UNAUTHENTICATED', 'Not signed in')
  }

  let body: UseAccountBody
  try {
    body = await readJsonBody<UseAccountBody>(request)
  } catch (err) {
    if (err instanceof BadRequestError) return errorResponse(400, err.code, err.message)
    throw err
  }

  const targetSessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
  const rememberMe = body.rememberMe === true
  if (!targetSessionId) {
    return errorResponse(400, 'MISSING_FIELDS', 'sessionId is required')
  }

  const allowed = await isSessionLinkedTo({ currentSessionId, targetSessionId })
  if (!allowed) {
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
    return errorResponse(404, 'SESSION_NOT_FOUND', 'Target session no longer exists')
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

  const token = signSessionToken(targetSessionId)
  const setCookieHeader = buildActiveCookieHeader({ token, request, rememberMe })

  return jsonResponse(
    { user, token },
    { status: 200, headers: { 'Set-Cookie': setCookieHeader } },
  )
}

export const Route = createFileRoute('/(auth)/v2/auth/use-account')({
  server: {
    handlers: {
      POST: async ({ request }) => handleUseAccount(request),
    },
  },
})
