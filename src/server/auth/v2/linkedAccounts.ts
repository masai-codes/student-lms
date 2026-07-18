import { inArray } from 'drizzle-orm'
import { db } from '@/db'
import { sessions, users } from '@/db/schema'
import type { SessionTokenPayload } from '@/server/auth/v2/sessionToken'

export type LinkedAccountUser = {
  id: number
  name: string
  email: string
  mobile: string | null
  role: string | null
}

export type LinkedAccount = {
  user: LinkedAccountUser
  sessionId: string
  isActive: boolean
}

/**
 * Every account this browser is currently signed into, per its own signed
 * session token — the token is the sole source of truth for "which accounts
 * are linked" (no DB-side linked-session list). Candidates are still checked
 * against `sessions` so one revoked elsewhere (its row deleted) drops out
 * here even if a stale copy still lingers in the token.
 */
export async function getLinkedAccountsForPayload(
  payload: SessionTokenPayload,
): Promise<LinkedAccount[]> {
  const candidateIds = payload.sessions.map((s) => s.sessionId)
  if (candidateIds.length === 0) return []

  const peerSessions = await db
    .select({ id: sessions.id, userId: sessions.userId })
    .from(sessions)
    .where(inArray(sessions.id, candidateIds))

  const userIds = peerSessions
    .map((s) => s.userId)
    .filter((id): id is number => id != null)

  if (userIds.length === 0) return []

  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      mobile: users.mobile,
      role: users.role,
    })
    .from(users)
    .where(inArray(users.id, userIds))

  const userById = new Map(userRows.map((u) => [u.id, u]))

  return peerSessions
    .map((peer): LinkedAccount | null => {
      const user = peer.userId != null ? userById.get(peer.userId) : undefined
      if (!user) return null
      return {
        user,
        sessionId: peer.id,
        isActive: peer.id === payload.sessionId,
      }
    })
    .filter((x): x is LinkedAccount => x !== null)
}

/** Whether `targetSessionId` is one this browser's current token already vouches for. */
export function isSessionLinkedTo({
  payload,
  targetSessionId,
}: {
  payload: SessionTokenPayload
  targetSessionId: string
}): boolean {
  return payload.sessions.some((s) => s.sessionId === targetSessionId)
}
