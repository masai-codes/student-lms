import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { interviewSessions } from '@/db/schema'
import { ApiError } from '@/server/api/http/apiError'
import { requestInterviewTurnAudioStream } from '@/server/api/interviews/clients/openRouterAudioChat'
import { requestOpenRouterChatCompletion } from '@/server/api/interviews/clients/openRouterClient'
import {
  getInterviewAudioModel,
  getInterviewReportModel,
  INTERVIEW_MAX_FOLLOW_UPS,
} from '@/server/api/interviews/constants'
import {
  buildClassifyActionMessages,
  buildDecisionMessages,
  buildDecisionSystemPrompt,
  buildInterviewMessages,
  buildInterviewSystemPrompt,
  buildSpeakExactMessages,
  parseClassifiedAction,
  parseDecision,
  type ConversationExchange,
  type InterviewAnswerInput,
  type InterviewTurnAction,
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
  | { type: 'done'; result: SubmitInterviewTurnResult }

type DecidedTurn = {
  action: InterviewTurnAction
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
    {
      prompt: turn.question,
      transcript: turn.transcript,
      answerAudioBase64: turn.answerAudioBase64,
    },
    ...turn.followUps.map((followUp) => ({
      prompt: followUp.prompt,
      transcript: followUp.transcript,
      answerAudioBase64: followUp.answerAudioBase64,
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
    {
      prompt: currentTurn.question,
      transcript: currentTurn.transcript,
      answerAudioBase64: currentTurn.answerAudioBase64,
    },
    ...currentTurn.followUps.slice(0, -1).map((followUp) => ({
      prompt: followUp.prompt,
      transcript: followUp.transcript,
      answerAudioBase64: followUp.answerAudioBase64,
    })),
  ]
}

/**
 * Answers that arrive as text (`typed`, or `transcribed` via live client-side
 * STT) already give us the candidate's words up front, so the follow-up vs.
 * advance decision can be made by a plain text-only call (with a structured
 * plain-text response) BEFORE speaking anything — the exact decided wording
 * is then handed to the audio model to speak verbatim.
 */
async function decideFromText(input: {
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
  language: string
}): Promise<DecidedTurn> {
  const systemPrompt = buildDecisionSystemPrompt({
    topicLabel: input.topicLabel,
    domain: input.domain,
    rubricFocus: input.rubricFocus,
    questionNumber: input.questionNumber,
    totalQuestions: input.totalQuestions,
    followUpCount: input.followUpCount,
    maxFollowUps: INTERVIEW_MAX_FOLLOW_UPS,
    forced: input.forced,
    language: input.language,
  })

  const messages = buildDecisionMessages({
    systemPrompt,
    priorExchanges: input.priorExchanges,
    currentPrompt: input.currentPrompt,
    answerText: input.answerText,
  })

  const raw = await requestOpenRouterChatCompletion({
    model: getInterviewReportModel(),
    messages,
  })

  const isLastQuestion = input.questionNumber >= input.totalQuestions
  return parseDecision(raw, isLastQuestion)
}

/**
 * Audio answers go through a single combined audio-in/audio-out call that
 * both hears the candidate and speaks its response — there's no separate
 * decision step to read, so the resulting spoken transcript is classified
 * after the fact into the same follow_up/advance/end_interview shape.
 */
async function decideFromAudio(input: {
  spokenText: string
  questionNumber: number
  totalQuestions: number
  forced: boolean
}): Promise<DecidedTurn> {
  const isLastQuestion = input.questionNumber >= input.totalQuestions

  if (input.forced) {
    return {
      action: isLastQuestion ? 'end_interview' : 'advance',
      text: input.spokenText,
    }
  }

  const raw = await requestOpenRouterChatCompletion({
    model: getInterviewReportModel(),
    messages: buildClassifyActionMessages({
      spokenText: input.spokenText,
      isLastQuestion,
    }),
  })

  return {
    action: parseClassifiedAction(raw, isLastQuestion),
    text: input.spokenText,
  }
}

/**
 * One turn of the interview's per-question follow-up loop. For text answers,
 * the decision is made first (text-only) and the exact wording is then
 * spoken verbatim by the audio model — for `advance`, that's the decided
 * transition line immediately followed by the next question's fixed text,
 * spoken together as one natural utterance. For audio answers, the model
 * decides and speaks in the same breath, and the outcome is classified
 * afterwards. Either way, audio is streamed to the client as it's generated.
 */
async function* runInterviewTurn(input: {
  topicLabel: string
  domain: string
  rubricFocus: Array<string>
  priorExchanges: Array<ConversationExchange>
  currentPrompt: string
  answer: InterviewAnswerInput
  questionNumber: number
  totalQuestions: number
  followUpCount: number
  forced: boolean
  nextQuestionText: string | null
  language: string
}): AsyncGenerator<
  | { type: 'audio-delta'; data: string }
  | { type: 'decided'; decision: DecidedTurn }
> {
  if (input.answer.kind === 'audio') {
    const systemPrompt = buildInterviewSystemPrompt({
      topicLabel: input.topicLabel,
      domain: input.domain,
      rubricFocus: input.rubricFocus,
      questionNumber: input.questionNumber,
      totalQuestions: input.totalQuestions,
      followUpCount: input.followUpCount,
      maxFollowUps: INTERVIEW_MAX_FOLLOW_UPS,
      forced: input.forced,
      nextQuestionText: input.nextQuestionText,
      language: input.language,
    })

    const messages = buildInterviewMessages({
      systemPrompt,
      priorExchanges: input.priorExchanges,
      currentPrompt: input.currentPrompt,
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

    if (!spokenText) throw new ApiError(422, 'INTERVIEW_RESPONSE_EMPTY')

    const decision = await decideFromAudio({
      spokenText,
      questionNumber: input.questionNumber,
      totalQuestions: input.totalQuestions,
      forced: input.forced,
    })
    yield { type: 'decided', decision }
    return
  }

  const decision = await decideFromText({
    topicLabel: input.topicLabel,
    domain: input.domain,
    rubricFocus: input.rubricFocus,
    priorExchanges: input.priorExchanges,
    currentPrompt: input.currentPrompt,
    answerText: input.answer.text,
    questionNumber: input.questionNumber,
    totalQuestions: input.totalQuestions,
    followUpCount: input.followUpCount,
    forced: input.forced,
    language: input.language,
  })

  if (!decision.text) throw new ApiError(422, 'INTERVIEW_RESPONSE_EMPTY')

  // For `advance`, speak the decided transition line and the next fixed
  // question together as one natural utterance ("Great, let's move on to
  // the next question. <question>") rather than two separate audio calls.
  const spokenText =
    decision.action === 'advance' && input.nextQuestionText
      ? `${decision.text} ${input.nextQuestionText}`
      : decision.text

  for await (const event of requestInterviewTurnAudioStream({
    messages: buildSpeakExactMessages(spokenText),
    model: getInterviewAudioModel(),
  })) {
    if (event.type === 'audio') {
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
    answer: input.answer,
    questionNumber,
    totalQuestions,
    followUpCount,
    forced,
    nextQuestionText,
    language: row.language,
  })) {
    if (event.type === 'audio-delta') {
      yield { type: 'audio-delta', data: event.data }
    } else {
      decision = event.decision
    }
  }
  if (!decision) throw new ApiError(422, 'INTERVIEW_RESPONSE_EMPTY')

  const now = new Date().toISOString()
  const answerTranscript =
    input.answer.kind === 'typed' || input.answer.kind === 'transcribed'
      ? input.answer.text.trim()
      : ''
  const answerAudioBase64 =
    input.answer.kind === 'audio' ? input.answer.base64 : null
  const answerSource = input.answer.kind === 'typed' ? 'typed' : 'voice'

  // Fill in whichever slot was pending, regardless of what happens next.
  let turnsWithAnswer = updateTurn(turns, pendingTurn.questionIndex, (turn) => {
    if (isAnsweringMain) {
      return {
        ...turn,
        transcript: answerTranscript,
        answerAudioBase64,
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
              answerAudioBase64,
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
