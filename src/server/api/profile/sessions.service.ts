import { and, desc, eq, ne } from 'drizzle-orm'
import { db } from '@/db'
import { sessions } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import {
  describeUserAgent,
  resolveDeviceKind,
} from '@/server/api/profile/parseUserAgent'
import type { ProfileSession } from '@/server/api/profile/profile.types'

/**
 * The user's active sessions, most recently active first, with the caller's own
 * session flagged.
 *
 * The old LMS also returned a `location` — but its resolver hard-coded it to
 * `null` (the IP lookup was commented out), so the UI showed a permanently
 * blank line. Dropped rather than reproduced.
 */
export async function getSessions(
  userId: number,
  currentSessionId: string | null,
): Promise<Array<ProfileSession>> {
  const rows = await db
    .select({
      id: sessions.id,
      userAgent: sessions.userAgent,
      lastActivity: sessions.lastActivity,
    })
    .from(sessions)
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.lastActivity))

  return rows.map((row) => ({
    id: row.id,
    device: describeUserAgent(row.userAgent),
    deviceKind: resolveDeviceKind(row.userAgent ?? ''),
    lastActiveAt: row.lastActivity,
    isCurrent: row.id === currentSessionId,
  }))
}

/**
 * Revokes one session. Scoped to the caller's own sessions, so a guessed id
 * cannot sign out a different student. Revoking the current session is refused —
 * that is what "log out" is for, and doing it here would strand the UI.
 */
export async function removeSession(
  userId: number,
  sessionId: string,
  currentSessionId: string | null,
): Promise<void> {
  if (sessionId === '') throw new ApiError(400, 'INVALID_SESSION_ID')
  if (sessionId === currentSessionId) {
    throw new ApiError(409, 'CANNOT_REVOKE_CURRENT_SESSION')
  }

  const [existing] = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)))
    .limit(1)

  if (!existing) throw new ApiError(404, 'SESSION_NOT_FOUND')

  await db.delete(sessions).where(eq(sessions.id, sessionId))
}

/**
 * Signs out of every *other* device, keeping the caller signed in. The old
 * behaviour dropped the current session too, so "sign out of all devices"
 * silently logged you out of the tab you clicked it in.
 *
 * @returns how many sessions were revoked.
 */
export async function removeOtherSessions(
  userId: number,
  currentSessionId: string | null,
): Promise<number> {
  const revocable = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(
      currentSessionId
        ? and(eq(sessions.userId, userId), ne(sessions.id, currentSessionId))
        : eq(sessions.userId, userId),
    )

  if (revocable.length === 0) return 0

  await db
    .delete(sessions)
    .where(
      currentSessionId
        ? and(eq(sessions.userId, userId), ne(sessions.id, currentSessionId))
        : eq(sessions.userId, userId),
    )

  return revocable.length
}
