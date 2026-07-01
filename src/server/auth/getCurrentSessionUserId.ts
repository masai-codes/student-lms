import { eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'
import { getRequest } from '@tanstack/react-start/server'
import { db } from '@/db'
import { sessions } from '@/db/schema'

type SessionTokenPayload = {
  sessionId?: string
}

const DEFAULT_COOKIE_NAME = 'masai_school_course_session_v3_dev'

function parseCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return {}

  return cookieHeader
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, item) => {
      const separatorIndex = item.indexOf('=')
      if (separatorIndex <= 0) return acc
      const key = item.slice(0, separatorIndex).trim()
      const value = item.slice(separatorIndex + 1).trim()
      if (!key) return acc
      acc[key] = decodeURIComponent(value)
      return acc
    }, {})
}

function verifyJwtAndGetSessionId(token: string | undefined): string | null {
  if (!token) return null
  const jwtSecret = process.env.JWT_SECRET_KEY
  if (!jwtSecret) return null

  try {
    const payload = jwt.verify(token, jwtSecret) as SessionTokenPayload
    return payload.sessionId ?? null
  } catch {
    return null
  }
}

function extractBearerToken(authHeader: string | null): string | undefined {
  if (!authHeader) return undefined
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : undefined
}

/** Session id from a raw session JWT (e.g. a `?token=` query param on redirect). */
export function readSessionIdFromToken(
  token: string | null | undefined,
): string | null {
  return verifyJwtAndGetSessionId(token ?? undefined)
}

/** Session id from raw `Cookie` header (for Nitro routes, tests, etc.). */
export function readSessionIdFromCookieHeader(
  cookieHeader: string | null,
): string | null {
  const cookieName = process.env.COOKIE_NAME || DEFAULT_COOKIE_NAME
  const cookies = parseCookieHeader(cookieHeader)
  return verifyJwtAndGetSessionId(cookies[cookieName])
}

/** Session id from raw `Authorization: Bearer <jwt>` header. */
export function readSessionIdFromAuthHeader(
  authHeader: string | null,
): string | null {
  return verifyJwtAndGetSessionId(extractBearerToken(authHeader))
}

/** Session id embedded in the JWT cookie (matches `sessions.id`). */
export function readSessionIdFromCookie(): string | null {
  const request = getRequest()
  return readSessionIdFromCookieHeader(request.headers.get('cookie'))
}

/** User id for a session id (matches `sessions.userId`), or null if the session is gone. */
export async function lookupUserIdBySessionId(
  sessionId: string | null,
): Promise<number | null> {
  if (!sessionId) return null

  const sessionRecord = await db
    .select({ userId: sessions.userId })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1)

  return sessionRecord[0]?.userId ?? null
}

export function getUserIdFromCookieHeader(
  cookieHeader: string | null,
): Promise<number | null> {
  const sessionId = readSessionIdFromCookieHeader(cookieHeader)
  return lookupUserIdBySessionId(sessionId)
}

/**
 * Resolves the session user id from either an `Authorization: Bearer <jwt>` header
 * (preferred — used by mobile clients) or the session cookie (used by browsers).
 */
export function getUserIdFromRequest(request: Request): Promise<number | null> {
  const authSessionId = readSessionIdFromAuthHeader(
    request.headers.get('authorization'),
  )
  if (authSessionId) {
    return lookupUserIdBySessionId(authSessionId)
  }
  return getUserIdFromCookieHeader(request.headers.get('cookie'))
}

export async function getCurrentSessionUserId() {
  const request = getRequest()
  return getUserIdFromRequest(request)
}
