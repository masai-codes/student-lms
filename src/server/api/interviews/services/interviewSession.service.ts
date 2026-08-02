import { and, desc, eq, gte } from 'drizzle-orm'
import { db } from '@/db'
import { interviewSessions } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { requestOpenRouterText } from '@/server/api/interviews/clients/openRouterTextChat'
import {
  INTERVIEW_DAILY_SESSION_LIMIT,
  INTERVIEW_TOTAL_QUESTIONS,
  getInterviewTextModel,
} from '@/server/api/interviews/constants'
import { buildFirstQuestionPrompt } from '@/server/api/interviews/services/buildInterviewPrompt'
import { resolveInterviewTopicSelection } from '@/server/api/interviews/services/resolveInterviewTopicSelection'
import type {
  InterviewSession,
  InterviewTurn,
} from '@/server/api/interviews/types/interviewSession'

type InterviewSessionRow = typeof interviewSessions.$inferSelect

function utcStartOfDayIso(now: Date = new Date()): string {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
  return start.toISOString().slice(0, 19).replace('T', ' ')
}

async function assertUnderDailySessionLimit(userId: number): Promise<void> {
  const rows = await db
    .select({ id: interviewSessions.id })
    .from(interviewSessions)
    .where(
      and(
        eq(interviewSessions.userId, userId),
        gte(interviewSessions.createdAt, utcStartOfDayIso()),
      ),
    )

  if (rows.length >= INTERVIEW_DAILY_SESSION_LIMIT) {
    throw new ApiError(429, 'INTERVIEW_DAILY_LIMIT')
  }
}

function mapRowToSession(row: InterviewSessionRow): InterviewSession {
  return {
    id: row.id,
    userId: row.userId,
    topicId: row.topicId,
    topicLabel: row.topicLabel,
    domain: row.domain as InterviewSession['domain'],
    status: row.status as InterviewSession['status'],
    turns: (row.turns as Array<InterviewTurn>) ?? [],
    report: (row.report as InterviewSession['report']) ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    completedAt: row.completedAt,
  }
}

export type CreateInterviewSessionResult = {
  sessionId: number
  question: string
}

export async function createInterviewSession(
  userId: number,
  topicId: string,
): Promise<CreateInterviewSessionResult> {
  await assertUnderDailySessionLimit(userId)

  const selection = await resolveInterviewTopicSelection(userId, topicId)

  const text = await requestOpenRouterText({
    model: getInterviewTextModel(),
    prompt: buildFirstQuestionPrompt({
      topicLabel: selection.topicLabel,
      domain: selection.domain,
      rubricFocus: selection.rubricFocus,
      totalQuestions: INTERVIEW_TOTAL_QUESTIONS,
    }),
  })

  const question = text.trim()
  if (!question) {
    throw new ApiError(503, 'INTERVIEW_QUESTION_GENERATION_FAILED')
  }

  const now = new Date().toISOString()
  const firstTurn: InterviewTurn = {
    index: 0,
    question,
    transcript: '',
    answerSource: 'voice',
    askedAt: now,
    answeredAt: '',
  }

  const [insertResult] = await db.insert(interviewSessions).values({
    userId,
    topicId: selection.topicId,
    topicLabel: selection.topicLabel,
    domain: selection.domain,
    status: 'in_progress',
    turns: [firstTurn],
  })

  const sessionId = Number(insertResult.insertId)
  if (!sessionId) {
    throw new ApiError(503, 'INTERVIEW_SESSION_CREATE_FAILED')
  }

  return { sessionId, question }
}

export async function getInterviewSessionRowForUser(
  userId: number,
  sessionId: number,
): Promise<InterviewSessionRow> {
  const rows = await db
    .select()
    .from(interviewSessions)
    .where(eq(interviewSessions.id, sessionId))
    .orderBy(desc(interviewSessions.id))
    .limit(1)

  const row = rows.at(0)
  if (!row) throw new ApiError(404, 'INTERVIEW_SESSION_NOT_FOUND')
  if (row.userId !== userId)
    throw new ApiError(403, 'INTERVIEW_SESSION_FORBIDDEN')

  return row
}

export async function getInterviewSession(
  userId: number,
  sessionId: number,
): Promise<InterviewSession> {
  const row = await getInterviewSessionRowForUser(userId, sessionId)
  return mapRowToSession(row)
}
