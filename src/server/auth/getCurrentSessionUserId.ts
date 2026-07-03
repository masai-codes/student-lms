import { eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import { getCookie, getRequestHeader } from '@tanstack/react-start/server'
import { db } from '@/db'
import { sessions } from '@/db/schema'
import { getCookieName, getJwtSecret } from '@/server/auth/v2/sessionConfig'

type SessionTokenPayload = {
  sessionId?: string
}

function extractBearerToken(authHeader: string | null): string | undefined {
  const match = authHeader?.match(/^Bearer\s+(.+)$/i)
  return match?.[1].trim()
}

/** Verifies a session JWT and returns its embedded session id, or `null` if absent/invalid. */
function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null

  const jwtSecret = getJwtSecret()

  try {
    const payload = jwt.verify(token, jwtSecret) as SessionTokenPayload
    return payload.sessionId ?? null
  } catch {
    return null
  }
}

async function lookupUserIdBySessionId(
  sessionId: string | null,
): Promise<number | null> {
  if (!sessionId) return null

  const rows = await db
    .select({ userId: sessions.userId })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1)

  return rows[0]?.userId ?? null
}

/**
 * Session id from either an `Authorization: Bearer <jwt>` header (preferred — used by
 * mobile clients) or the session cookie (used by browsers).
 */
export function getCurrentUserSessionId(): string | null {
  const authHeader = getRequestHeader('Authorization')
  let jwtToken: string | undefined
  if (authHeader) jwtToken = extractBearerToken(authHeader)
  else jwtToken = getCookie(getCookieName())
  if (jwtToken) return verifySessionToken(jwtToken)
  return null
}

/**
 * Resolves the session user id from either an `Authorization: Bearer <jwt>` header
 * (preferred — used by mobile clients) or the session cookie (used by browsers).
 */
export function getCurrentUserId(): Promise<number | null> {
  return lookupUserIdBySessionId(getCurrentUserSessionId())
}
