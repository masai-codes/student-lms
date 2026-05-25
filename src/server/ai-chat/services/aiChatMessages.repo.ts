import { and, asc, eq } from 'drizzle-orm'
import type { AiChatRole } from '@/server/ai-chat/types'

import { db } from '@/db'
import { aiChatMessages } from '@/db/schema'

function nowSqlString(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

export type AiChatMessageRow = {
  id: number
  userId: number
  lectureId: number
  role: AiChatRole
  source: 'text' | 'voice'
  content: string
  sessionId: string | null
  createdAt: string
}

function rowToTyped(row: typeof aiChatMessages.$inferSelect): AiChatMessageRow {
  return {
    id: row.id,
    userId: row.userId,
    lectureId: row.lectureId,
    role: row.role === 'assistant' ? 'assistant' : 'user',
    source: row.source === 'voice' ? 'voice' : 'text',
    content: row.content,
    sessionId: row.sessionId,
    createdAt: row.createdAt,
  }
}

export async function insertAiChatMessage(input: {
  userId: number
  lectureId: number
  role: AiChatRole
  content: string
  source?: 'text' | 'voice'
  sessionId?: string | null
}): Promise<AiChatMessageRow> {
  const createdAt = nowSqlString()

  await db.insert(aiChatMessages).values({
    userId: input.userId,
    lectureId: input.lectureId,
    role: input.role,
    source: input.source ?? 'text',
    content: input.content,
    sessionId: input.sessionId ?? null,
    createdAt,
  })

  const inserted = await db
    .select()
    .from(aiChatMessages)
    .where(
      and(
        eq(aiChatMessages.userId, input.userId),
        eq(aiChatMessages.lectureId, input.lectureId),
        eq(aiChatMessages.createdAt, createdAt),
        eq(aiChatMessages.content, input.content),
      ),
    )
    .orderBy(asc(aiChatMessages.id))
    .limit(1)

  if (inserted.length === 0) {
    throw new Error('AI_CHAT_MESSAGE_INSERT_FAILED')
  }

  return rowToTyped(inserted[0])
}

export async function listAiChatMessages(input: {
  userId: number
  lectureId: number
}): Promise<Array<AiChatMessageRow>> {
  const rows = await db
    .select()
    .from(aiChatMessages)
    .where(
      and(
        eq(aiChatMessages.userId, input.userId),
        eq(aiChatMessages.lectureId, input.lectureId),
      ),
    )
    .orderBy(asc(aiChatMessages.createdAt), asc(aiChatMessages.id))

  return rows.map(rowToTyped)
}

export async function listRecentAiChatMessagesForContext(input: {
  userId: number
  lectureId: number
  limit: number
}): Promise<Array<{ role: AiChatRole; content: string }>> {
  const rows = await listAiChatMessages({
    userId: input.userId,
    lectureId: input.lectureId,
  })
  const tail = rows.slice(-Math.max(0, input.limit))
  return tail.map(row => ({ role: row.role, content: row.content }))
}
