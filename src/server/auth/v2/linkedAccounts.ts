import { eq, inArray } from 'drizzle-orm'
import { db } from '@/db'
import { sessions, users } from '@/db/schema'

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

type SessionPayload = {
  linkedSessionIds?: string[]
}

function parsePayload(payload: string): SessionPayload {
  try {
    return JSON.parse(Buffer.from(payload, 'base64').toString('utf-8')) as SessionPayload
  } catch {
    return {}
  }
}

async function readLinkedSessionIds(sessionId: string): Promise<string[]> {
  const rows = await db
    .select({ id: sessions.id, payload: sessions.payload })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1)

  const current = rows[0]
  if (!current) return []

  const parsed = parsePayload(current.payload)
  if (parsed.linkedSessionIds && parsed.linkedSessionIds.length > 0) {
    return parsed.linkedSessionIds
  }
  return [current.id]
}

export async function getLinkedAccountsForSession(sessionId: string): Promise<LinkedAccount[]> {
  const peerIds = await readLinkedSessionIds(sessionId)
  if (peerIds.length === 0) return []

  const peerSessions = await db
    .select({ id: sessions.id, userId: sessions.userId })
    .from(sessions)
    .where(inArray(sessions.id, peerIds))

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
        isActive: peer.id === sessionId,
      }
    })
    .filter((x): x is LinkedAccount => x !== null)
}

export async function isSessionLinkedTo({
  currentSessionId,
  targetSessionId,
}: {
  currentSessionId: string
  targetSessionId: string
}): Promise<boolean> {
  if (currentSessionId === targetSessionId) return true

  const peerIds = await readLinkedSessionIds(currentSessionId)
  return peerIds.includes(targetSessionId)
}
