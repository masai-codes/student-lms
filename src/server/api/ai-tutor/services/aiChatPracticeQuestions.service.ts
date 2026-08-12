import { and, desc, eq } from 'drizzle-orm'
import type { AiTutorFeedbackPlatform } from '@/server/api/ai-tutor/feedbackPlatform'
import type { AiTutorChatLanguage } from '@/server/api/ai-tutor/chatLanguage'
import type { AiChatHistoryEntry } from '@/server/api/ai-tutor/types/chatHistory'
import type { PracticeQuestionsPayload } from '@/server/api/ai-tutor/types/practiceQuestions'
import type { SubmitAiTutorFeedbackResponse } from '@/server/api/ai-tutor/types/feedback'
import { AI_TUTOR_FEEDBACK_MAX_LENGTH } from '@/server/api/ai-tutor/constants'
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

function normalizeFeedbackText(value: string | null): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  return trimmed.slice(0, AI_TUTOR_FEEDBACK_MAX_LENGTH)
}

export async function submitChatPracticeFeedback(input: {
  userId: number
  lectureId: number
  chatId: number
  rating: number
  feedback: string | null
}): Promise<SubmitAiTutorFeedbackResponse> {
  if (!Number.isInteger(input.rating) || input.rating < 0 || input.rating > 6) {
    throw new ApiError(400, 'AI_TUTOR_RATING_INVALID')
  }

  const rows = await db
    .select({ id: aiChatPracticeQuestions.id })
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

  const feedback = normalizeFeedbackText(input.feedback)
  const now = nowTimestamp()

  await db
    .update(aiChatPracticeQuestions)
    .set({
      rating: input.rating,
      feedback,
      feedbackTime: now,
      updatedAt: now,
    })
    .where(eq(aiChatPracticeQuestions.id, input.chatId))

  return {
    chatId: input.chatId,
    rating: input.rating,
    feedback,
  }
}

/** Records a student's submitted answers for one already-generated quiz. */
export async function submitPracticeQuestionAnswers(input: {
  userId: number
  chatId: number
  quizId: string
  answers: Record<string, string>
}): Promise<void> {
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

  const history = parseChatHistory(rows[0].chatHistory)
  const entryIndex = history.findIndex(
    (entry) => entry.practiceQuestions?.quizId === input.quizId,
  )
  if (entryIndex === -1) {
    throw new ApiError(404, 'AI_TUTOR_QUIZ_NOT_FOUND')
  }

  const entry = history[entryIndex]
  const nextHistory = [...history]
  nextHistory[entryIndex] = {
    ...entry,
    practiceQuestions: {
      ...entry.practiceQuestions!,
      answers: input.answers,
    },
  }

  await db
    .update(aiChatPracticeQuestions)
    .set({ chatHistory: nextHistory, updatedAt: nowTimestamp() })
    .where(eq(aiChatPracticeQuestions.id, input.chatId))
}

export async function appendChatPracticeHistory(input: {
  rowId: number
  userMessage: string
  aiMessage: string
  platform: AiTutorFeedbackPlatform
  language: AiTutorChatLanguage
  existingHistory: Array<AiChatHistoryEntry>
  practiceQuestions?: PracticeQuestionsPayload
}): Promise<void> {
  const nextHistory: Array<AiChatHistoryEntry> = [
    ...input.existingHistory,
    {
      userMessage: input.userMessage,
      aiMessage: input.aiMessage,
      platform: input.platform,
      language: input.language,
      ...(input.practiceQuestions
        ? { practiceQuestions: input.practiceQuestions }
        : {}),
    },
  ]

  await db
    .update(aiChatPracticeQuestions)
    .set({
      chatHistory: nextHistory,
      updatedAt: nowTimestamp(),
    })
    .where(eq(aiChatPracticeQuestions.id, input.rowId))
}
