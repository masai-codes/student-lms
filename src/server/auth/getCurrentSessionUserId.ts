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

async function getSessionIdFromCookieValue(cookieValue: string | undefined) {
  if (!cookieValue) return null

  
  const jwtSecret = process.env.JWT_SECRET_KEY
  if (!jwtSecret) return null

  try {
    const payload = jwt.verify(cookieValue, jwtSecret) as SessionTokenPayload
    return payload.sessionId ?? null
  } catch {
    return null
  }
}

/** Session id from raw `Cookie` header (for Nitro routes, tests, etc.). */
export async function readSessionIdFromCookieHeader(cookieHeader: string | null): Promise<string | null> {
  
  const cookieName = process.env.COOKIE_NAME || DEFAULT_COOKIE_NAME
  const cookies = parseCookieHeader(cookieHeader)
  return getSessionIdFromCookieValue(cookies[cookieName])
}

/** Session id embedded in the JWT cookie (matches `sessions.id`). */
export async function readSessionIdFromCookie(): Promise<string | null> {
  const request = getRequest()
  return readSessionIdFromCookieHeader(request.headers.get('cookie'))
}

export async function getUserIdFromCookieHeader(cookieHeader: string | null): Promise<number | null> {
  const sessionId = await readSessionIdFromCookieHeader(cookieHeader)
  if (!sessionId) return null

  const sessionRecord = await db
    .select({ userId: sessions.userId })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1)

  return sessionRecord[0]?.userId ?? null
}

export async function getCurrentSessionUserId() {
  const request = getRequest()
  return getUserIdFromCookieHeader(request.headers.get('cookie'))
}
