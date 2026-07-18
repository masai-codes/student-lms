import { eq } from 'drizzle-orm'
import { getCookie, getRequestHeader } from '@tanstack/react-start/server'
import { db } from '@/db'
import { sessions, users } from '@/db/schema'
import { isUserDeactivated } from '@/server/restrictions/deactivatedUser'
import { getCookieName } from '@/server/auth/v2/sessionConfig'
import {
  verifySessionToken,
  type SessionTokenPayload,
} from '@/server/auth/v2/sessionToken'

function extractBearerToken(authHeader: string | null): string | undefined {
  const match = authHeader?.match(/^Bearer\s+(.+)$/i)
  return match?.[1].trim()
}

function currentJwtToken(): string | undefined {
  const authHeader = getRequestHeader('Authorization')
  if (authHeader) return extractBearerToken(authHeader)
  return getCookie(getCookieName())
}

async function lookupUserIdBySessionId(
  sessionId: string | null,
): Promise<number | null> {
  if (!sessionId) return null

  const rows = await db
    .select({ userId: sessions.userId, status: users.status })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1)

  const row = rows[0]
  if (!row) return null
  // Deactivated mid-session: resolve to no user so every session-gated request
  // (REST APIs and layout loaders alike) is cut off on its next call.
  if (isUserDeactivated(row.status)) return null
  return row.userId
}

/**
 * Full session token payload (current session id + every linked session's own
 * expiry bookkeeping) from either an `Authorization: Bearer <jwt>` header
 * (preferred — used by mobile clients) or the session cookie (used by browsers).
 * Pure — verifies/decodes only, never reissues the cookie, so it's safe to call
 * from any context (including `createServerFn` handlers).
 */
export function getCurrentSessionPayload(): SessionTokenPayload | null {
  return verifySessionToken(currentJwtToken())
}

/**
 * Session id from either an `Authorization: Bearer <jwt>` header (preferred — used by
 * mobile clients) or the session cookie (used by browsers).
 */
export function getCurrentUserSessionId(): string | null {
  return getCurrentSessionPayload()?.sessionId ?? null
}

/**
 * Resolves the session user id from either an `Authorization: Bearer <jwt>` header
 * (preferred — used by mobile clients) or the session cookie (used by browsers).
 */
export function getCurrentUserId(): Promise<number | null> {
  return lookupUserIdBySessionId(getCurrentUserSessionId())
}
