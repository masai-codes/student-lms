import type { TurnCase } from './fixtures/turnCases'
import type { QuestionGenCase } from './fixtures/questionGenCases'
import { judge } from './judge'

export type TurnOutput = { calledTool: boolean; spokenText: string }

/** Case 1 & the deterministic half of case 3: for scenarios where we're
 * confident about the right call (a clearly complete or clearly thin
 * answer), the tool-call decision must match. Scenarios with no single
 * right answer (expectAdvance === null) are skipped, not failed. */
export function advanceMatchesExpectation({
  output,
  input,
}: {
  output: TurnOutput
  input: TurnCase
}) {
  if (input.expectAdvance === null) return null
  return {
    name: 'advance_matches_expectation',
    score: output.calledTool === input.expectAdvance ? 1 : 0,
  }
}

const VERBAL_MOVE_ON_PATTERN =
  /\b(let'?s move on|move on to|next question|wrap(ping)? up|let'?s continue)\b/i

/** Case 1, literally: "moving on" must always be expressed by calling
 * move_to_next_question, silently — never said out loud instead of (or
 * alongside) the tool call. */
export function noVerbalMoveOnWithoutToolCall({
  output,
}: {
  output: TurnOutput
}) {
  const saidMoveOnWithoutCalling =
    !output.calledTool && VERBAL_MOVE_ON_PATTERN.test(output.spokenText)
  return {
    name: 'no_verbal_move_on_without_tool_call',
    score: saidMoveOnWithoutCalling ? 0 : 1,
  }
}

/** Case 3: once an answer is already complete, the interviewer shouldn't
 * "swell" — tacking on an unwarranted extra follow-up instead of moving on.
 * Only meaningful for cases we expect to advance; a follow-up there is
 * either clearly fine (didn't happen) or needs a judge call to confirm it
 * was actually warranted rather than padding. */
export async function followUpWasWarranted({
  output,
  input,
}: {
  output: TurnOutput
  input: TurnCase
}) {
  if (input.expectAdvance !== true) return null
  if (output.calledTool) return { name: 'follow_up_was_warranted', score: 1 }

  const verdict = await judge(
    `An interviewer is running a mock interview on "${input.topicLabel}" (${input.domain} track).
Question asked: "${input.currentPrompt}"
Candidate's answer: "${input.answerText}"

The candidate's answer above is already thorough and complete for this question. Instead of moving on, the interviewer asked this follow-up instead: "${output.spokenText}"

Was asking this follow-up actually warranted (it probes a real, still-uncovered gap), or is it unnecessary padding/dwelling on an answer that was already sufficient?`,
  )
  return { name: 'follow_up_was_warranted', score: verdict.score }
}

/** Case 4: when a candidate is stuck or directly asks for the solution, the
 * interviewer must not hand it over — at most a small nudge. */
export async function doesNotAnswerForCandidate({
  output,
  input,
}: {
  output: TurnOutput
  input: TurnCase
}) {
  if (!input.checkNoSelfAnswer) return null

  const verdict = await judge(
    `An interviewer is running a mock interview on "${input.topicLabel}" (${input.domain} track).
Question asked: "${input.currentPrompt}"
Candidate said: "${input.answerText}"
Interviewer responded: "${output.calledTool ? '(silently moved on without saying anything)' : output.spokenText}"

Does the interviewer's response give away the actual answer, definition, or a concrete solving example, rather than just offering a small nudge or hint (or appropriately declining and letting them keep trying)?

Watch closely for a response that states the definition/mechanism/a worked example up front and only afterward tacks on a forward-looking follow-up question (e.g. "...that's what a decorator does — here's an example. Now, what's another use case?"). The trailing question does NOT undo it — if the substantive content was already handed over before the question, that still counts as giving the answer away, even though the response is nominally still "asking something."

Also watch for a "hint" that, even though phrased as a question, explicitly names the specific mechanism/technique/component that IS the answer (e.g. "What if you moved the state to a common parent component?") — naming it inside a question is still naming it. A genuine hint asks about a consequence or effect ("what would happen if...") without naming the mechanism itself.

Score 1 only if the interviewer withheld the substantive content and let the candidate supply it. Score 0 if the definition, mechanism, or a concrete example was stated by the interviewer at any point in the response.`,
  )
  return { name: 'does_not_answer_for_candidate', score: verdict.score }
}

export const TURN_DECISION_SCORERS = [
  advanceMatchesExpectation,
  noVerbalMoveOnWithoutToolCall,
  followUpWasWarranted,
  doesNotAnswerForCandidate,
]

/** Case 2: generated questions must actually target the stated topic. */
export async function questionsAreRelevantToTopic({
  output,
  input,
}: {
  output: Array<string>
  input: QuestionGenCase
}) {
  const verdict = await judge(
    `These interview questions were generated for a mock interview on "${input.topicLabel}" (${input.domain} track).
Focus areas: ${input.rubricFocus.join(', ')}.
Subtopics the questions should draw from: ${input.subtopics.join(', ')}.

Generated questions:
${output.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Score how well this WHOLE set of questions targets the stated topic/subtopics — 1 if every question is clearly specific to this topic and grounded in the subtopics, 0 if questions are generic, off-topic, or could just as easily belong to an unrelated topic.`,
  )
  return { name: 'questions_relevant_to_topic', score: verdict.score }
}

export function generatedExpectedCount({
  output,
  input,
}: {
  output: Array<string>
  input: QuestionGenCase
}) {
  return {
    name: 'generated_expected_count',
    score: output.length === input.numQuestions ? 1 : 0,
  }
}

export function noDuplicateQuestions({ output }: { output: Array<string> }) {
  const normalized = output.map((q) => q.trim().toLowerCase())
  const unique = new Set(normalized)
  return {
    name: 'no_duplicate_questions',
    score: unique.size === normalized.length ? 1 : 0,
  }
}

export const QUESTION_RELEVANCE_SCORERS = [
  questionsAreRelevantToTopic,
  generatedExpectedCount,
  noDuplicateQuestions,
]
