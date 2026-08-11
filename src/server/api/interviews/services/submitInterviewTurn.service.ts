import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { interviewSessions } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { requestInterviewTurnAudioStream } from '@/server/api/interviews/clients/openRouterAudioChat'
import {
  INTERVIEW_MAX_FOLLOW_UPS,
  INTERVIEW_MIN_FOLLOW_UPS,
  getInterviewAudioModel,
} from '@/server/api/interviews/constants'
import {
  MOVE_TO_NEXT_QUESTION_TOOL,
  buildAskQuestionMessages,
  buildAskQuestionSystemPrompt,
  buildClosingRemarksMessages,
  buildClosingRemarksSystemPrompt,
  buildTurnMessages,
  buildTurnSystemPrompt,
  type ConversationExchange,
  type InterviewAnswerInput,
} from '@/server/api/interviews/services/buildInterviewPrompt'
import { generateInterviewReport } from '@/server/api/interviews/services/generateInterviewReport.service'
import { getInterviewSessionRowForUser } from '@/server/api/interviews/services/interviewSession.service'
import { resolveRubricFocusForStoredTopic } from '@/server/api/interviews/services/resolveInterviewTopicSelection'
import type {
  InterviewFollowUp,
  InterviewReport,
  InterviewTurn,
} from '@/server/api/interviews/types/interviewSession'

export type SubmitInterviewTurnResult =
  | { status: 'in_progress'; nextQuestion: string }
  | { status: 'completed'; report: InterviewReport }

export type SubmitInterviewTurnStreamEvent =
  | { type: 'audio-delta'; data: string }
  /** The next question's text, so far — for `advance` this is the full text,
   * emitted once, immediately (it's pre-generated and already known before
   * any TTS call starts). For a follow-up it's the model's in-progress
   * spoken text, re-emitted as it streams in. Either way, the client can
   * render it right away instead of waiting for the whole turn (including
   * playback) to finish. `kind` tells the client which slot to render it
   * into — a new planned question (with an incremented question number) vs.
   * a follow-up on the current one. */
  | { type: 'question-text'; text: string; kind: 'advance' | 'follow_up' }
  | { type: 'done'; result: SubmitInterviewTurnResult }

type InterviewTurnAction = 'follow_up' | 'advance' | 'end_interview'

type DecidedTurn = {
  action: InterviewTurnAction
  /** For `follow_up`, the follow-up question the model just spoke. Empty for
   * `advance`/`end_interview` — those are always silent (either a tool call,
   * or a system-forced move once the follow-up cap is hit). */
  text: string
}

/** Which slot of the current question the candidate's answer is filling in —
 * the question's main answer, or one of its (always-pending-when-found)
 * follow-ups. */
function findPendingSlot(turn: InterviewTurn): {
  isAnsweringMain: boolean
  pendingFollowUp: InterviewFollowUp | null
} {
  if (turn.transcript === '') {
    return { isAnsweringMain: true, pendingFollowUp: null }
  }
  return {
    isAnsweringMain: false,
    pendingFollowUp: turn.followUps.at(-1) ?? null,
  }
}

function turnToExchanges(turn: InterviewTurn): Array<ConversationExchange> {
  return [
    { prompt: turn.question, transcript: turn.transcript },
    ...turn.followUps.map((followUp) => ({
      prompt: followUp.prompt,
      transcript: followUp.transcript,
    })),
  ]
}

/**
 * Full conversation-so-far, flattened into a plain ordered list of prompt/
 * answer exchanges — every earlier (fully completed) question and its
 * follow-ups, plus, for the current question, whatever's already been
 * answered on it before the pending slot.
 */
function buildPriorExchanges(
  turns: Array<InterviewTurn>,
  currentTurn: InterviewTurn,
  isAnsweringMain: boolean,
): Array<ConversationExchange> {
  const earlier = turns
    .filter((turn) => turn.questionIndex < currentTurn.questionIndex)
    .flatMap(turnToExchanges)

  if (isAnsweringMain) return earlier

  return [
    ...earlier,
    { prompt: currentTurn.question, transcript: currentTurn.transcript },
    ...currentTurn.followUps.slice(0, -1).map((followUp) => ({
      prompt: followUp.prompt,
      transcript: followUp.transcript,
    })),
  ]
}

/**
 * Decides the outcome of one answer and, for `advance`/`end_interview`,
 * immediately chains the follow-on TTS call (next question, or closing
 * remarks) so the candidate hears it in the same response — a tool call (or
 * a forced move) is silent on its own, so something always has to speak next.
 */
async function* runInterviewTurn(input: {
  topicLabel: string
  domain: string
  rubricFocus: Array<string>
  priorExchanges: Array<ConversationExchange>
  currentPrompt: string
  answerText: string
  questionNumber: number
  totalQuestions: number
  followUpCount: number
  forced: boolean
  nextQuestionText: string | null
  language: string
}): AsyncGenerator<
  | { type: 'audio-delta'; data: string }
  | { type: 'question-text'; text: string; kind: 'advance' | 'follow_up' }
  | { type: 'decided'; decision: DecidedTurn }
> {
  const isLastQuestion = input.nextQuestionText === null

  let decision: DecidedTurn
  if (input.forced) {
    decision = {
      action: isLastQuestion ? 'end_interview' : 'advance',
      text: '',
    }
  } else {
    const systemPrompt = buildTurnSystemPrompt({
      topicLabel: input.topicLabel,
      domain: input.domain,
      rubricFocus: input.rubricFocus,
      questionNumber: input.questionNumber,
      totalQuestions: input.totalQuestions,
      followUpCount: input.followUpCount,
      minFollowUps: INTERVIEW_MIN_FOLLOW_UPS,
      maxFollowUps: INTERVIEW_MAX_FOLLOW_UPS,
      language: input.language,
    })

    const messages = buildTurnMessages({
      systemPrompt,
      priorExchanges: input.priorExchanges,
      currentPrompt: input.currentPrompt,
      answerText: input.answerText,
    })

    let spokenText = ''
    let calledTool = false
    for await (const event of requestInterviewTurnAudioStream({
      messages,
      model: getInterviewAudioModel(),
      tools: [MOVE_TO_NEXT_QUESTION_TOOL],
    })) {
      if (event.type === 'audio') {
        yield { type: 'audio-delta', data: event.data }
      } else if (event.type === 'transcript') {
        // A follow-up's text isn't known ahead of time like a planned
        // question's — surface it as it's generated so the candidate isn't
        // staring at a stale screen until the whole turn (audio included)
        // finishes.
        yield {
          type: 'question-text',
          text: event.textSoFar,
          kind: 'follow_up',
        }
      } else if (event.type === 'tool_call') {
        calledTool = true
      } else if (event.type === 'final') {
        spokenText = event.spokenText
      }
    }

    if (calledTool) {
      decision = {
        action: isLastQuestion ? 'end_interview' : 'advance',
        text: '',
      }
    } else {
      if (!spokenText) throw new ApiError(422, 'INTERVIEW_RESPONSE_EMPTY')
      decision = { action: 'follow_up', text: spokenText }
    }
  }

  if (decision.action === 'advance') {
    // The next planned question's text is already known from the session
    // record — no reason to wait for TTS before showing it.
    yield {
      type: 'question-text',
      text: input.nextQuestionText ?? '',
      kind: 'advance',
    }

    const systemPrompt = buildAskQuestionSystemPrompt({
      questionText: input.nextQuestionText ?? '',
      language: input.language,
      forcedTransition: input.forced,
    })
    for await (const event of requestInterviewTurnAudioStream({
      messages: buildAskQuestionMessages(systemPrompt),
      model: getInterviewAudioModel(),
    })) {
      if (event.type === 'audio')
        yield { type: 'audio-delta', data: event.data }
    }
  } else if (decision.action === 'end_interview') {
    const systemPrompt = buildClosingRemarksSystemPrompt(
      input.language,
      input.forced,
    )
    for await (const event of requestInterviewTurnAudioStream({
      messages: buildClosingRemarksMessages(systemPrompt),
      model: getInterviewAudioModel(),
    })) {
      if (event.type === 'audio')
        yield { type: 'audio-delta', data: event.data }
    }
  }

  yield { type: 'decided', decision }
}

/** Replaces the turn at `questionIndex` with the result of `updater`, leaving every other turn untouched. */
function updateTurn(
  turns: Array<InterviewTurn>,
  questionIndex: number,
  updater: (turn: InterviewTurn) => InterviewTurn,
): Array<InterviewTurn> {
  return turns.map((turn) =>
    turn.questionIndex === questionIndex ? updater(turn) : turn,
  )
}

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
  const pendingTurn = turns.find((turn) => turn.answeredAt === '')
  if (!pendingTurn) {
    throw new ApiError(409, 'INTERVIEW_SESSION_NOT_IN_PROGRESS')
  }

  const { isAnsweringMain, pendingFollowUp } = findPendingSlot(pendingTurn)
  const currentPrompt = pendingFollowUp?.prompt ?? pendingTurn.question
  const priorExchanges = buildPriorExchanges(
    turns,
    pendingTurn,
    isAnsweringMain,
  )

  const rubricFocus = resolveRubricFocusForStoredTopic(
    row.topicId,
    row.topicLabel,
  )
  const totalQuestions = row.numQuestions
  const questionNumber = pendingTurn.questionIndex + 1
  const isLastQuestion = pendingTurn.questionIndex >= totalQuestions - 1
  const nextQuestionText = isLastQuestion
    ? null
    : (turns.find(
        (turn) => turn.questionIndex === pendingTurn.questionIndex + 1,
      )?.question ?? null)
  const followUpCount = pendingTurn.followUps.length
  const forced = followUpCount >= INTERVIEW_MAX_FOLLOW_UPS

  let decision: DecidedTurn | null = null
  for await (const event of runInterviewTurn({
    topicLabel: row.topicLabel,
    domain: row.domain,
    rubricFocus,
    priorExchanges,
    currentPrompt,
    answerText: input.answer.text,
    questionNumber,
    totalQuestions,
    followUpCount,
    forced,
    nextQuestionText,
    language: row.language,
  })) {
    if (event.type === 'audio-delta') {
      yield { type: 'audio-delta', data: event.data }
    } else if (event.type === 'question-text') {
      yield { type: 'question-text', text: event.text, kind: event.kind }
    } else {
      decision = event.decision
    }
  }
  if (!decision) throw new ApiError(422, 'INTERVIEW_RESPONSE_EMPTY')

  const now = new Date().toISOString()
  const answerTranscript = input.answer.text.trim()
  const answerSource = 'voice' as const

  // Fill in whichever slot was pending, regardless of what happens next.
  let turnsWithAnswer = updateTurn(turns, pendingTurn.questionIndex, (turn) => {
    if (isAnsweringMain) {
      return {
        ...turn,
        transcript: answerTranscript,
        answerAudioBase64: null,
        answerSource,
      }
    }
    return {
      ...turn,
      followUps: turn.followUps.map((followUp, i) =>
        i === turn.followUps.length - 1
          ? {
              ...followUp,
              transcript: answerTranscript,
              answerAudioBase64: null,
              answerSource,
              answeredAt: now,
            }
          : followUp,
      ),
    }
  })

  if (decision.action === 'end_interview') {
    turnsWithAnswer = updateTurn(
      turnsWithAnswer,
      pendingTurn.questionIndex,
      (turn) => ({
        ...turn,
        answeredAt: now,
      }),
    )

    const report = await generateInterviewReport({
      topicLabel: row.topicLabel,
      domain: row.domain,
      rubricFocus,
      turns: turnsWithAnswer,
    })

    await db
      .update(interviewSessions)
      .set({
        turns: turnsWithAnswer,
        status: 'completed',
        report,
        completedAt: now,
      })
      .where(eq(interviewSessions.id, row.id))

    yield { type: 'done', result: { status: 'completed', report } }
    return
  }

  if (decision.action === 'advance') {
    let nextTurns = updateTurn(
      turnsWithAnswer,
      pendingTurn.questionIndex,
      (turn) => ({
        ...turn,
        answeredAt: now,
      }),
    )
    nextTurns = updateTurn(
      nextTurns,
      pendingTurn.questionIndex + 1,
      (turn) => ({
        ...turn,
        askedAt: now,
      }),
    )

    await db
      .update(interviewSessions)
      .set({ turns: nextTurns })
      .where(eq(interviewSessions.id, row.id))

    yield {
      type: 'done',
      result: { status: 'in_progress', nextQuestion: nextQuestionText ?? '' },
    }
    return
  }

  // follow_up
  const nextTurns = updateTurn(
    turnsWithAnswer,
    pendingTurn.questionIndex,
    (turn) => ({
      ...turn,
      followUps: [
        ...turn.followUps,
        {
          prompt: decision.text,
          transcript: '',
          answerAudioBase64: null,
          answerSource: 'voice',
          askedAt: now,
          answeredAt: '',
        },
      ],
    }),
  )

  await db
    .update(interviewSessions)
    .set({ turns: nextTurns })
    .where(eq(interviewSessions.id, row.id))

  yield {
    type: 'done',
    result: { status: 'in_progress', nextQuestion: decision.text },
  }
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
