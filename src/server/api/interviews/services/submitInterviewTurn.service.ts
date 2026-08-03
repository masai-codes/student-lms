import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { interviewSessions } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { requestInterviewTurnAudioStream } from '@/server/api/interviews/clients/openRouterAudioChat'
import {
  getInterviewAudioModel,
  INTERVIEW_TOTAL_QUESTIONS,
} from '@/server/api/interviews/constants'
import {
  buildInterviewMessages,
  buildInterviewSystemPrompt,
  type InterviewAnswerInput,
} from '@/server/api/interviews/services/buildInterviewPrompt'
import { generateInterviewReport } from '@/server/api/interviews/services/generateInterviewReport.service'
import { getInterviewSessionRowForUser } from '@/server/api/interviews/services/interviewSession.service'
import { resolveRubricFocusForStoredTopic } from '@/server/api/interviews/services/resolveInterviewTopicSelection'
import type {
  InterviewReport,
  InterviewTurn,
} from '@/server/api/interviews/types/interviewSession'

export type SubmitInterviewTurnResult =
  | { status: 'in_progress'; nextQuestion: string }
  | { status: 'completed'; report: InterviewReport }

export type SubmitInterviewTurnStreamEvent =
  | { type: 'audio-delta'; data: string }
  | { type: 'done'; result: SubmitInterviewTurnResult }

/**
 * One audio-in/audio-out model call per turn — the model hears (or reads)
 * the candidate's answer and speaks its response directly, streamed to the
 * client as it's generated. Whether the interview continues is decided here
 * by turn count, not by the model: the system prompt tells the model in
 * advance whether this is the final question, so its spoken response is
 * either the next question or a closing remark accordingly.
 */
export async function* submitInterviewTurnStream(input: {
  userId: number
  sessionId: number
  answer: InterviewAnswerInput
}): AsyncGenerator<SubmitInterviewTurnStreamEvent> {
  const row = await getInterviewSessionRowForUser(input.userId, input.sessionId)

  if (row.status !== 'in_progress') {
    throw new ApiError(409, 'INTERVIEW_SESSION_NOT_IN_PROGRESS')
  }

  const turns = (row.turns as Array<InterviewTurn>) ?? []
  const pendingIndex = turns.findIndex((turn) => turn.answeredAt === '')
  const pendingTurn = turns.at(pendingIndex)
  if (!pendingTurn) {
    throw new ApiError(409, 'INTERVIEW_SESSION_NOT_IN_PROGRESS')
  }

  const priorTurns = turns.filter((turn) => turn.answeredAt !== '')
  const rubricFocus = resolveRubricFocusForStoredTopic(
    row.topicId,
    row.topicLabel,
  )
  const questionNumber = pendingTurn.index + 1

  const systemPrompt = buildInterviewSystemPrompt({
    topicLabel: row.topicLabel,
    domain: row.domain,
    rubricFocus,
    questionNumber,
    totalQuestions: INTERVIEW_TOTAL_QUESTIONS,
  })

  const messages = buildInterviewMessages({
    systemPrompt,
    priorTurns,
    currentQuestion: pendingTurn.question,
    answer: input.answer,
  })

  let spokenText = ''
  for await (const event of requestInterviewTurnAudioStream({
    messages,
    model: getInterviewAudioModel(),
  })) {
    if (event.type === 'audio') {
      yield { type: 'audio-delta', data: event.data }
    } else {
      spokenText = event.spokenText
    }
  }

  if (!spokenText) {
    // Un-persisted on purpose: a response the interviewer had nothing to say
    // for should let the student re-submit rather than baking a corrupted
    // turn into history.
    throw new ApiError(422, 'INTERVIEW_RESPONSE_EMPTY')
  }

  const now = new Date().toISOString()
  const answeredTurn: InterviewTurn = {
    ...pendingTurn,
    transcript:
      input.answer.kind === 'typed' || input.answer.kind === 'transcribed'
        ? input.answer.text.trim()
        : '',
    answerAudioBase64:
      input.answer.kind === 'audio' ? input.answer.base64 : null,
    answerSource: input.answer.kind === 'typed' ? 'typed' : 'voice',
    answeredAt: now,
  }

  const answeredTurns = [
    ...turns.slice(0, pendingIndex),
    answeredTurn,
    ...turns.slice(pendingIndex + 1),
  ]

  const shouldContinue = answeredTurns.length < INTERVIEW_TOTAL_QUESTIONS

  if (shouldContinue) {
    const nextTurn: InterviewTurn = {
      index: answeredTurns.length,
      question: spokenText,
      transcript: '',
      answerAudioBase64: null,
      answerSource: 'voice',
      askedAt: now,
      answeredAt: '',
    }
    const nextTurns = [...answeredTurns, nextTurn]

    await db
      .update(interviewSessions)
      .set({ turns: nextTurns })
      .where(eq(interviewSessions.id, row.id))

    yield {
      type: 'done',
      result: { status: 'in_progress', nextQuestion: spokenText },
    }
    return
  }

  const report = await generateInterviewReport({
    topicLabel: row.topicLabel,
    domain: row.domain,
    rubricFocus,
    turns: answeredTurns,
  })

  await db
    .update(interviewSessions)
    .set({
      turns: answeredTurns,
      status: 'completed',
      report,
      completedAt: now,
    })
    .where(eq(interviewSessions.id, row.id))

  yield { type: 'done', result: { status: 'completed', report } }
}

/**
 * Blocking counterpart — kept for API completeness, but the UI always uses
 * the streaming route since spoken audio output requires `stream: true`.
 * Drains the streaming generator and discards the audio chunks, returning
 * only the final result.
 */
export async function submitInterviewTurn(input: {
  userId: number
  sessionId: number
  answer: InterviewAnswerInput
}): Promise<SubmitInterviewTurnResult> {
  let result: SubmitInterviewTurnResult | null = null
  for await (const event of submitInterviewTurnStream(input)) {
    if (event.type === 'done') result = event.result
  }
  if (!result) {
    throw new Error('INTERVIEW_OPENROUTER_INVALID_RESPONSE')
  }
  return result
}
