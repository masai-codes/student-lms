import { and, desc, eq, gte } from 'drizzle-orm'
import { db } from '@/db'
import { interviewSessions } from '@/db/schema'
import type { AiTutorChatLanguage } from '@/server/api/ai-tutor/chatLanguage'
import { ApiError } from '@/server/api/http/apiError'
import { requestInterviewTurnAudioStream } from '@/server/api/interviews/clients/openRouterAudioChat'
import {
  INTERVIEW_DAILY_SESSION_LIMIT,
  INTERVIEW_TOTAL_QUESTIONS,
  getInterviewAudioModel,
} from '@/server/api/interviews/constants'
import {
  buildOpeningTurnMessages,
  buildOpeningTurnSystemPrompt,
} from '@/server/api/interviews/services/buildInterviewPrompt'
import { generateAllInterviewQuestions } from '@/server/api/interviews/services/generateInterviewQuestions.service'
import { resolveInterviewTopicSelection } from '@/server/api/interviews/services/resolveInterviewTopicSelection'
import type {
  InterviewSession,
  InterviewSessionStatus,
  InterviewSessionSummary,
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
    numQuestions: row.numQuestions,
    language: row.language,
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

export type CreateInterviewSessionStreamEvent =
  | { type: 'audio-delta'; data: string }
  | { type: 'done'; result: CreateInterviewSessionResult }

/**
 * All `INTERVIEW_TOTAL_QUESTIONS` questions are generated up front, in one
 * text-only call, and stored fixed from the start — never one at a time as
 * the interview progresses. Only question 1 is actually spoken here (an
 * audio-out call that greets the candidate and asks it verbatim); the rest
 * sit in the DB unasked (`askedAt: ''`) until the interview reaches them.
 */
export async function* createInterviewSessionStream(
  userId: number,
  topicId: string,
  language: AiTutorChatLanguage,
): AsyncGenerator<CreateInterviewSessionStreamEvent> {
  await assertUnderDailySessionLimit(userId)

  const selection = await resolveInterviewTopicSelection(userId, topicId)

  const questions = await generateAllInterviewQuestions({
    topicLabel: selection.topicLabel,
    domain: selection.domain,
    rubricFocus: selection.rubricFocus,
    numQuestions: INTERVIEW_TOTAL_QUESTIONS,
  })

  const systemPrompt = buildOpeningTurnSystemPrompt({
    topicLabel: selection.topicLabel,
    domain: selection.domain,
    rubricFocus: selection.rubricFocus,
    totalQuestions: INTERVIEW_TOTAL_QUESTIONS,
    firstQuestion: questions[0],
    language,
  })

  let spokenText = ''
  for await (const event of requestInterviewTurnAudioStream({
    messages: buildOpeningTurnMessages(systemPrompt),
    model: getInterviewAudioModel(),
  })) {
    if (event.type === 'audio') {
      yield { type: 'audio-delta', data: event.data }
    } else if (event.type === 'final') {
      spokenText = event.spokenText
    }
  }

  if (!spokenText.trim()) {
    throw new ApiError(503, 'INTERVIEW_QUESTION_GENERATION_FAILED')
  }

  const now = new Date().toISOString()
  const turns: Array<InterviewTurn> = questions.map((question, index) => ({
    questionIndex: index,
    question,
    askedAt: index === 0 ? now : '',
    transcript: '',
    answerAudioBase64: null,
    answerSource: 'voice',
    followUps: [],
    answeredAt: '',
  }))

  const [insertResult] = await db.insert(interviewSessions).values({
    userId,
    topicId: selection.topicId,
    topicLabel: selection.topicLabel,
    domain: selection.domain,
    status: 'in_progress',
    numQuestions: INTERVIEW_TOTAL_QUESTIONS,
    language,
    turns,
  })

  const sessionId = Number(insertResult.insertId)
  if (!sessionId) {
    throw new ApiError(503, 'INTERVIEW_SESSION_CREATE_FAILED')
  }

  yield { type: 'done', result: { sessionId, question: questions[0] } }
}

/**
 * Blocking counterpart — kept for API completeness, but the UI always uses
 * the streaming route since spoken audio output requires `stream: true`.
 * Drains the streaming generator and discards the audio chunks, returning
 * only the final result.
 */
export async function createInterviewSession(
  userId: number,
  topicId: string,
  language: AiTutorChatLanguage,
): Promise<CreateInterviewSessionResult> {
  let result: CreateInterviewSessionResult | null = null
  for await (const event of createInterviewSessionStream(
    userId,
    topicId,
    language,
  )) {
    if (event.type === 'done') result = event.result
  }
  if (!result) {
    throw new Error('INTERVIEW_OPENROUTER_INVALID_RESPONSE')
  }
  return result
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

/** Marks an in-progress session as abandoned when the candidate ends it
 * early — a no-op if it's already finished (completed or abandoned). */
export async function abandonInterviewSession(
  userId: number,
  sessionId: number,
): Promise<void> {
  const row = await getInterviewSessionRowForUser(userId, sessionId)
  if (row.status !== 'in_progress') return

  await db
    .update(interviewSessions)
    .set({ status: 'abandoned' })
    .where(eq(interviewSessions.id, row.id))
}

export async function listInterviewSessions(
  userId: number,
): Promise<Array<InterviewSessionSummary>> {
  const rows = await db
    .select({
      id: interviewSessions.id,
      topicLabel: interviewSessions.topicLabel,
      status: interviewSessions.status,
      createdAt: interviewSessions.createdAt,
      completedAt: interviewSessions.completedAt,
    })
    .from(interviewSessions)
    .where(eq(interviewSessions.userId, userId))
    .orderBy(desc(interviewSessions.id))

  return rows.map((row) => ({
    ...row,
    status: row.status as InterviewSessionStatus,
  }))
}
