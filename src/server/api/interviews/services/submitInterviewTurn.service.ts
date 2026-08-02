import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { interviewSessions } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { requestInterviewAudioChatTurn } from '@/server/api/interviews/clients/openRouterAudioChat'
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
  | { status: 'in_progress'; transcript: string; nextQuestion: string }
  | { status: 'completed'; transcript: string; report: InterviewReport }

export async function submitInterviewTurn(input: {
  userId: number
  sessionId: number
  answer: InterviewAnswerInput
}): Promise<SubmitInterviewTurnResult> {
  const row = await getInterviewSessionRowForUser(input.userId, input.sessionId)

  if (row.status !== 'in_progress') {
    throw new ApiError(409, 'INTERVIEW_SESSION_NOT_IN_PROGRESS')
  }

  const turns = (row.turns as Array<InterviewTurn>) ?? []
  const pendingIndex = turns.findIndex((turn) => turn.transcript === '')
  const pendingTurn = turns.at(pendingIndex)
  if (!pendingTurn) {
    throw new ApiError(409, 'INTERVIEW_SESSION_NOT_IN_PROGRESS')
  }

  const priorTurns = turns.filter((turn) => turn.transcript !== '')
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

  const result = await requestInterviewAudioChatTurn({
    messages,
    model: getInterviewAudioModel(),
  })

  const transcript = result.transcript.trim()
  if (!transcript) {
    // Un-persisted on purpose (§5.2): a bad/refused transcription should let
    // the student re-record rather than baking a corrupted turn into history.
    throw new ApiError(422, 'INTERVIEW_TRANSCRIPT_EMPTY')
  }

  const now = new Date().toISOString()
  const answeredTurn: InterviewTurn = {
    ...pendingTurn,
    transcript,
    answerSource: input.answer.kind === 'typed' ? 'typed' : 'voice',
    answeredAt: now,
  }

  const answeredTurns = [
    ...turns.slice(0, pendingIndex),
    answeredTurn,
    ...turns.slice(pendingIndex + 1),
  ]

  const shouldContinue =
    Boolean(result.nextQuestion) &&
    answeredTurns.length < INTERVIEW_TOTAL_QUESTIONS

  if (shouldContinue && result.nextQuestion) {
    const nextTurn: InterviewTurn = {
      index: answeredTurns.length,
      question: result.nextQuestion,
      transcript: '',
      answerSource: 'voice',
      askedAt: now,
      answeredAt: '',
    }
    const nextTurns = [...answeredTurns, nextTurn]

    await db
      .update(interviewSessions)
      .set({ turns: nextTurns })
      .where(eq(interviewSessions.id, row.id))

    return {
      status: 'in_progress',
      transcript,
      nextQuestion: result.nextQuestion,
    }
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

  return { status: 'completed', transcript, report }
}
