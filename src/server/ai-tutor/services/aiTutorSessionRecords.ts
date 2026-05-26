import { randomUUID } from 'node:crypto'

import { and, asc, desc, eq, isNotNull } from 'drizzle-orm'

import { db } from '@/db'
import { aiTutorSessions } from '@/db/schema'

function nowSqlString(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

export type AiTutorSessionRecord = {
  id: number
  uniqueId: string
  sessionId: string | null
  roomName: string | null
  createdAt: string | null
}

export async function createAiTutorSessionRecord(input: {
  userId: number
  lectureId: number
  language: string
  participantName: string
  durationMinutes: number
}): Promise<AiTutorSessionRecord> {
  const uniqueId = randomUUID()
  const now = nowSqlString()

  await db.insert(aiTutorSessions).values({
    userId: input.userId,
    lectureId: input.lectureId,
    uniqueId,
    language: input.language,
    participantName: input.participantName,
    durationMinutes: input.durationMinutes,
    createdAt: now,
    updatedAt: now,
  })

  const inserted = await db
    .select()
    .from(aiTutorSessions)
    .where(eq(aiTutorSessions.uniqueId, uniqueId))
    .limit(1)

  if (inserted.length === 0) {
    throw new Error('AI_TUTOR_RECORD_INSERT_FAILED')
  }
  const row = inserted[0]

  return {
    id: row.id,
    uniqueId: row.uniqueId,
    sessionId: row.sessionId,
    roomName: row.roomName,
    createdAt: row.createdAt,
  }
}

export async function attachTokenServerSessionToRecord(input: {
  recordId: number
  sessionId: string
  roomName: string
  url: string
  token: string
  participantName: string
  durationMinutes: number
}): Promise<void> {
  await db
    .update(aiTutorSessions)
    .set({
      sessionId: input.sessionId,
      roomName: input.roomName,
      websocketUrl: input.url,
      token: input.token,
      participantName: input.participantName,
      durationMinutes: input.durationMinutes,
      errorMessage: null,
      updatedAt: nowSqlString(),
    })
    .where(eq(aiTutorSessions.id, input.recordId))
}

export async function markRecordFailed(input: {
  recordId: number
  errorMessage: string
}): Promise<void> {
  await db
    .update(aiTutorSessions)
    .set({
      errorMessage: input.errorMessage.slice(0, 65_000),
      updatedAt: nowSqlString(),
    })
    .where(eq(aiTutorSessions.id, input.recordId))
}

export async function findOwnedSessionByActiveSessionId(input: {
  userId: number
  sessionId: string
}): Promise<{ id: number; lectureId: number; sessionId: string } | null> {
  const rows = await db
    .select({
      id: aiTutorSessions.id,
      lectureId: aiTutorSessions.lectureId,
      sessionId: aiTutorSessions.sessionId,
    })
    .from(aiTutorSessions)
    .where(
      and(
        eq(aiTutorSessions.userId, input.userId),
        eq(aiTutorSessions.sessionId, input.sessionId),
      ),
    )
    .limit(1)

  if (rows.length === 0) return null
  const row = rows[0]
  if (!row.sessionId) return null
  return { id: row.id, lectureId: row.lectureId, sessionId: row.sessionId }
}

export async function listSessionsForLecture(input: {
  userId: number
  lectureId: number
}): Promise<
  Array<{
    id: number
    sessionId: string
    uniqueId: string
    createdAt: string | null
  }>
> {
  const rows = await db
    .select({
      id: aiTutorSessions.id,
      sessionId: aiTutorSessions.sessionId,
      uniqueId: aiTutorSessions.uniqueId,
      createdAt: aiTutorSessions.createdAt,
    })
    .from(aiTutorSessions)
    .where(
      and(
        eq(aiTutorSessions.userId, input.userId),
        eq(aiTutorSessions.lectureId, input.lectureId),
        isNotNull(aiTutorSessions.sessionId),
      ),
    )
    .orderBy(asc(aiTutorSessions.createdAt))

  return rows
    .filter((row): row is typeof row & { sessionId: string } =>
      Boolean(row.sessionId),
    )
    .map(row => ({
      id: row.id,
      sessionId: row.sessionId,
      uniqueId: row.uniqueId,
      createdAt: row.createdAt,
    }))
}

export async function updateLatestSessionFeedback(input: {
  userId: number
  lectureId: number
  rating: number
  feedback: string | null
}): Promise<{ sessionId: string | null; feedbackAt: string | null } | null> {
  const latest = await db
    .select({
      id: aiTutorSessions.id,
      sessionId: aiTutorSessions.sessionId,
    })
    .from(aiTutorSessions)
    .where(
      and(
        eq(aiTutorSessions.userId, input.userId),
        eq(aiTutorSessions.lectureId, input.lectureId),
        isNotNull(aiTutorSessions.sessionId),
      ),
    )
    .orderBy(desc(aiTutorSessions.createdAt))
    .limit(1)

  if (latest.length === 0) return null
  const row = latest[0]

  const now = nowSqlString()
  await db
    .update(aiTutorSessions)
    .set({
      rating: input.rating,
      feedback: input.feedback,
      feedbackAt: now,
      updatedAt: now,
    })
    .where(eq(aiTutorSessions.id, row.id))

  return { sessionId: row.sessionId, feedbackAt: now }
}
