import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { chatbotSessions } from '@/db/schema'
import { DEFAULT_CHATBOT_SESSION_TITLE } from '@/server/api/chatbot/constants'
import type { ChatMode, ChatbotSessionSummary } from '@/server/api/chatbot/types'

function toSessionSummary(row: typeof chatbotSessions.$inferSelect): ChatbotSessionSummary {
  return {
    sessionId: row.id,
    lectureId: row.lectureId,
    title: row.title,
    lastMode: row.lastMode === 'text' ? 'text' : 'voice',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function parseMode(value: unknown): ChatMode {
  return value === 'text' ? 'text' : 'voice'
}

export async function listChatbotSessionsByLecture(params: {
  userId: number
  lectureId: number
}): Promise<ChatbotSessionSummary[]> {
  const rows = await db
    .select()
    .from(chatbotSessions)
    .where(and(eq(chatbotSessions.userId, params.userId), eq(chatbotSessions.lectureId, params.lectureId)))
    .orderBy(desc(chatbotSessions.updatedAt))
    .limit(100)

  return rows.map(toSessionSummary)
}

export async function createChatbotSession(params: {
  userId: number
  lectureId: number
  lastMode: ChatMode
}): Promise<ChatbotSessionSummary> {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const sessionId = crypto.randomUUID()

  await db.insert(chatbotSessions).values({
    id: sessionId,
    userId: params.userId,
    lectureId: params.lectureId,
    title: DEFAULT_CHATBOT_SESSION_TITLE,
    lastMode: params.lastMode,
    createdAt: now,
    updatedAt: now,
  })

  const row = await getOwnedChatbotSessionById({
    sessionId,
    lectureId: params.lectureId,
    userId: params.userId,
  })

  if (!row) {
    throw new Error('CHATBOT_SESSION_CREATE_FAILED')
  }

  return toSessionSummary(row)
}

export async function getOwnedChatbotSessionById(params: {
  sessionId: string
  lectureId: number
  userId: number
}) {
  const rows = await db
    .select()
    .from(chatbotSessions)
    .where(
      and(
        eq(chatbotSessions.id, params.sessionId),
        eq(chatbotSessions.lectureId, params.lectureId),
        eq(chatbotSessions.userId, params.userId),
      ),
    )
    .limit(1)
  return rows[0] ?? null
}

export async function getChatbotSessionById(sessionId: string) {
  const rows = await db
    .select()
    .from(chatbotSessions)
    .where(eq(chatbotSessions.id, sessionId))
    .limit(1)
  return rows[0] ?? null
}

export async function updateOwnedChatbotSession(params: {
  sessionId: string
  lectureId: number
  userId: number
  patch: { title?: string; lastMode?: ChatMode }
}): Promise<ChatbotSessionSummary | null> {
  const existing = await getOwnedChatbotSessionById(params)
  if (!existing) {
    return null
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  await db
    .update(chatbotSessions)
    .set({
      title: params.patch.title ?? existing.title,
      lastMode: params.patch.lastMode ?? existing.lastMode,
      updatedAt: now,
    })
    .where(eq(chatbotSessions.id, params.sessionId))

  const updated = await getOwnedChatbotSessionById(params)
  return updated ? toSessionSummary(updated) : null
}

export async function resolveSessionForToken(params: {
  requestedSessionId?: string
  lectureId: number
  userId: number
  mode: ChatMode
}): Promise<ChatbotSessionSummary> {
  if (params.requestedSessionId) {
    const existing = await getOwnedChatbotSessionById({
      sessionId: params.requestedSessionId,
      lectureId: params.lectureId,
      userId: params.userId,
    })
    if (!existing) {
      throw new Error('CHATBOT_SESSION_NOT_FOUND')
    }
    const updated = await updateOwnedChatbotSession({
      sessionId: params.requestedSessionId,
      lectureId: params.lectureId,
      userId: params.userId,
      patch: { lastMode: params.mode },
    })
    if (!updated) {
      throw new Error('CHATBOT_SESSION_NOT_FOUND')
    }
    return updated
  }

  return createChatbotSession({
    userId: params.userId,
    lectureId: params.lectureId,
    lastMode: params.mode,
  })
}

