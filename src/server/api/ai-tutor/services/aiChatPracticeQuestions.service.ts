import { and, desc, eq } from 'drizzle-orm'
import type { AiChatHistoryEntry } from '@/server/api/ai-tutor/types/chatHistory'
import { db } from '@/db'
import { aiChatPracticeQuestions } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { parseChatHistory } from '@/server/api/ai-tutor/types/chatHistory'

function nowTimestamp(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ')
}

export type ChatPracticeRow = {
  id: number
  chatHistory: Array<AiChatHistoryEntry>
}

export async function findOrCreateChatPracticeRow(input: {
  userId: number
  lectureId: number
  chatId?: number
}): Promise<ChatPracticeRow> {
  if (input.chatId != null) {
    const rows = await db
      .select({
        id: aiChatPracticeQuestions.id,
        chatHistory: aiChatPracticeQuestions.chatHistory,
      })
      .from(aiChatPracticeQuestions)
      .where(
        and(
          eq(aiChatPracticeQuestions.id, input.chatId),
          eq(aiChatPracticeQuestions.lectureId, input.lectureId),
          eq(aiChatPracticeQuestions.userId, input.userId),
        ),
      )
      .limit(1)

    if (rows.length === 0) {
      throw new ApiError(404, 'AI_TUTOR_CHAT_NOT_FOUND')
    }

    const [row] = rows

    return {
      id: row.id,
      chatHistory: parseChatHistory(row.chatHistory),
    }
  }

  const now = nowTimestamp()
  const [insertResult] = await db.insert(aiChatPracticeQuestions).values({
    lectureId: input.lectureId,
    userId: input.userId,
    chatHistory: [],
    createdAt: now,
    updatedAt: now,
  })

  const insertId = Number(insertResult.insertId)
  if (!insertId) {
    throw new ApiError(500, 'SERVER_ERROR_CREATING_AI_TUTOR_CHAT')
  }

  return { id: insertId, chatHistory: [] }
}

export async function listChatPracticeConversations(input: {
  userId: number
  lectureId: number
}): Promise<
  Array<{
    id: number
    chatHistory: Array<AiChatHistoryEntry>
    updatedAt: string
  }>
> {
  const rows = await db
    .select({
      id: aiChatPracticeQuestions.id,
      chatHistory: aiChatPracticeQuestions.chatHistory,
      updatedAt: aiChatPracticeQuestions.updatedAt,
    })
    .from(aiChatPracticeQuestions)
    .where(
      and(
        eq(aiChatPracticeQuestions.userId, input.userId),
        eq(aiChatPracticeQuestions.lectureId, input.lectureId),
      ),
    )
    .orderBy(desc(aiChatPracticeQuestions.updatedAt))

  return rows.map((row) => ({
    id: row.id,
    chatHistory: parseChatHistory(row.chatHistory),
    updatedAt: row.updatedAt ?? '',
  }))
}

export async function getChatPracticeConversation(input: {
  userId: number
  chatId: number
}): Promise<ChatPracticeRow> {
  const rows = await db
    .select({
      id: aiChatPracticeQuestions.id,
      chatHistory: aiChatPracticeQuestions.chatHistory,
    })
    .from(aiChatPracticeQuestions)
    .where(
      and(
        eq(aiChatPracticeQuestions.id, input.chatId),
        eq(aiChatPracticeQuestions.userId, input.userId),
      ),
    )
    .limit(1)

  if (rows.length === 0) {
    throw new ApiError(404, 'AI_TUTOR_CHAT_NOT_FOUND')
  }

  const [row] = rows

  return {
    id: row.id,
    chatHistory: parseChatHistory(row.chatHistory),
  }
}

export async function appendChatPracticeHistory(input: {
  rowId: number
  userMessage: string
  aiMessage: string
  existingHistory: Array<AiChatHistoryEntry>
}): Promise<void> {
  const nextHistory: Array<AiChatHistoryEntry> = [
    ...input.existingHistory,
    { userMessage: input.userMessage, aiMessage: input.aiMessage },
  ]

  await db
    .update(aiChatPracticeQuestions)
    .set({
      chatHistory: nextHistory,
      updatedAt: nowTimestamp(),
    })
    .where(eq(aiChatPracticeQuestions.id, input.rowId))
}
