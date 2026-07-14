import { eq, sql } from 'drizzle-orm'
import { db } from '@/db'
import { sessions } from '@/db/schema'

export interface SessionInfo {
  id: string
  userAgent: string | null
  ipAddress: string | null
  lastActivity: number
}

export async function getSessions(userId: number): Promise<SessionInfo[]> {
  const rows = await db
    .select({
      id: sessions.id,
      userAgent: sessions.userAgent,
      ipAddress: sessions.ipAddress,
      lastActivity: sessions.lastActivity,
    })
    .from(sessions)
    .where(eq(sessions.userId, userId))

  return rows
}

export async function deleteSession(
  sessionId: string,
  userId: number,
): Promise<void> {
  await db
    .delete(sessions)
    .where(
      sql`${sessions.id} = ${sessionId} AND ${sessions.userId} = ${userId}`,
    )
}

export async function deleteAllSessions(userId: number): Promise<void> {
  await db.delete(sessions).where(eq(sessions.userId, userId))
}
