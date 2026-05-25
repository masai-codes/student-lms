import { and, asc, eq } from 'drizzle-orm'

import type { AiChatHistoryEntry } from '@/server/ai-chat/types'

import { db } from '@/db'
import { aiChatPracticeQuestions } from '@/db/schema'

function nowSqlString(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

export type ChatHistoryRow = {
  id: number
  chatHistory: Array<AiChatHistoryEntry>
}

/** Returns the row for (userId, lectureId) if it exists. */
export async function findChatRow(input: {
  userId: number
  lectureId: number
}): Promise<ChatHistoryRow | null> {
  const rows = await db
    .select({
      id: aiChatPracticeQuestions.id,
      chatHistory: aiChatPracticeQuestions.chatHistory,
    })
    .from(aiChatPracticeQuestions)
    .where(
      and(
        eq(aiChatPracticeQuestions.userId, input.userId),
        eq(aiChatPracticeQuestions.lectureId, input.lectureId),
      ),
    )
    .orderBy(asc(aiChatPracticeQuestions.id))
    .limit(1)

  if (rows.length === 0) return null
  return { id: rows[0].id, chatHistory: normalizeHistory(rows[0].chatHistory) }
}

/** Returns the existing row or inserts an empty one and returns it. */
export async function loadOrCreateChatRow(input: {
  userId: number
  lectureId: number
}): Promise<ChatHistoryRow> {
  const existing = await findChatRow(input)
  if (existing) return existing

  const now = nowSqlString()
  await db.insert(aiChatPracticeQuestions).values({
    userId: input.userId,
    lectureId: input.lectureId,
    chatHistory: [],
    createdAt: now,
    updatedAt: now,
  })

  const inserted = await findChatRow(input)
  if (!inserted) throw new Error('AI_CHAT_HISTORY_INSERT_FAILED')
  return inserted
}

/**
 * Read-modify-write the JSON history. Safe for the single-user-per-row pattern
 * used here; concurrent appends from two tabs would race, but the AI chat UI
 * only allows one active conversation per lecture so this is acceptable.
 */
export async function appendChatHistoryEntries(input: {
  rowId: number
  entries: ReadonlyArray<AiChatHistoryEntry>
}): Promise<Array<AiChatHistoryEntry>> {
  const rows = await db
    .select({ chatHistory: aiChatPracticeQuestions.chatHistory })
    .from(aiChatPracticeQuestions)
    .where(eq(aiChatPracticeQuestions.id, input.rowId))
    .limit(1)

  const current = rows.length ? normalizeHistory(rows[0].chatHistory) : []
  if (input.entries.length === 0) return current

  const next: Array<AiChatHistoryEntry> = [...current, ...input.entries]
  await db
    .update(aiChatPracticeQuestions)
    .set({ chatHistory: next, updatedAt: nowSqlString() })
    .where(eq(aiChatPracticeQuestions.id, input.rowId))

  return next
}

function normalizeHistory(value: unknown): Array<AiChatHistoryEntry> {
  if (!Array.isArray(value)) return []
  const out: Array<AiChatHistoryEntry> = []
  for (const item of value) {
    const entry = parseEntry(item)
    if (entry) out.push(entry)
  }
  return out
}

function parseEntry(item: unknown): AiChatHistoryEntry | null {
  if (!item || typeof item !== 'object') return null
  const obj = item as Record<string, unknown>
  const timestamp = typeof obj.timestamp === 'number' ? obj.timestamp : Date.now()

  if (obj.type === 'text') {
    if (typeof obj.userMessage !== 'string') return null
    if (typeof obj.aiMessage !== 'string') return null
    return {
      type: 'text',
      userMessage: obj.userMessage,
      aiMessage: obj.aiMessage,
      timestamp,
    }
  }

  if (
    obj.type === 'audio_chat_student_speaking' ||
    obj.type === 'audio_chat_ai_response'
  ) {
    if (typeof obj.content !== 'string') return null
    return { type: obj.type, content: obj.content, timestamp }
  }

  return null
}
