/**
 * Evaluates the per-answer decision call (buildTurnSystemPrompt +
 * requestInterviewTurnAudioStream) across every model in
 * TURN_DECISION_MODEL_VARIANTS — one Braintrust experiment per model, so
 * results compare side by side. Covers:
 *  - "moving on" must always be a silent move_to_next_question tool call,
 *    never just said out loud (advanceMatchesExpectation,
 *    noVerbalMoveOnWithoutToolCall)
 *  - the interviewer shouldn't keep dwelling once an answer is already
 *    complete (followUpWasWarranted)
 *  - the interviewer must never hand over the answer when a candidate is
 *    stuck or asks for it directly (doesNotAnswerForCandidate)
 *
 * Mock answers stand in for the candidate — voice answers are always
 * live-transcribed to text before reaching this call in production anyway
 * (see buildInterviewPrompt.ts), so a text-only harness exercises the exact
 * same decision logic real sessions hit.
 *
 * Run: npm run eval:interviews -- turnDecision.eval.ts
 * Requires OPENROUTER_API_KEY (and EVAL_JUDGE_MODEL/BRAINTRUST_API_KEY optionally).
 */
import { Eval } from 'braintrust'
import { requestInterviewTurnAudioStream } from '@/server/api/interviews/clients/openRouterAudioChat'
import {
  INTERVIEW_MAX_FOLLOW_UPS,
  INTERVIEW_MIN_FOLLOW_UPS,
} from '@/server/api/interviews/constants'
import {
  MOVE_TO_NEXT_QUESTION_TOOL,
  buildTurnMessages,
  buildTurnSystemPrompt,
} from '@/server/api/interviews/services/buildInterviewPrompt'
import { TURN_CASES, type TurnCase } from './fixtures/turnCases'
import { TURN_DECISION_MODEL_VARIANTS } from './models'
import { TURN_DECISION_SCORERS, type TurnOutput } from './scorers'

async function runTurnDecision(
  model: string,
  testCase: TurnCase,
): Promise<TurnOutput> {
  const systemPrompt = buildTurnSystemPrompt({
    topicLabel: testCase.topicLabel,
    domain: testCase.domain,
    rubricFocus: testCase.rubricFocus,
    questionNumber: testCase.questionNumber,
    totalQuestions: testCase.totalQuestions,
    followUpCount: testCase.followUpCount,
    minFollowUps: INTERVIEW_MIN_FOLLOW_UPS,
    maxFollowUps: INTERVIEW_MAX_FOLLOW_UPS,
    language: 'English',
  })

  const messages = buildTurnMessages({
    systemPrompt,
    priorExchanges: testCase.priorExchanges,
    currentPrompt: testCase.currentPrompt,
    answerText: testCase.answerText,
  })

  let spokenText = ''
  let calledTool = false
  for await (const event of requestInterviewTurnAudioStream({
    messages,
    model,
    tools: [MOVE_TO_NEXT_QUESTION_TOOL],
  })) {
    if (event.type === 'tool_call') calledTool = true
    else if (event.type === 'final') spokenText = event.spokenText
  }

  return { calledTool, spokenText }
}

for (const model of TURN_DECISION_MODEL_VARIANTS) {
  void Eval('interview-turn-decision', {
    experimentName: model,
    data: () =>
      TURN_CASES.map((testCase) => ({
        input: testCase,
        metadata: { model, caseName: testCase.name },
      })),
    task: (testCase: TurnCase) => runTurnDecision(model, testCase),
    scores: TURN_DECISION_SCORERS,
  })
}
