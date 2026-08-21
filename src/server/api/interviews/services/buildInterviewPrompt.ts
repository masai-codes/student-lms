import { buildEnforcedChatLanguageInstruction } from '@/server/api/ai-tutor/constants'
import type {
  InterviewAudioChatMessage,
  InterviewTool,
} from '@/server/api/interviews/clients/openRouterAudioChat'

/** Shared "how to speak" ground rules for every spoken-turn system prompt below. */
const SPOKEN_STYLE_RULES = `This is a real-time voice conversation — everything you say will be spoken aloud to the candidate. Speak naturally, like a human interviewer:
- No written formatting: no markdown, no headers, no bullet lists, no numbering.
- Do not summarize, repeat, or transcribe the candidate's answer back to them.
- A brief natural acknowledgement ("Got it", "Interesting") is fine, but keep it short — spend your words on what you say next, not on recapping what they said.
- Ask exactly one question at a time. Never answer on the candidate's behalf.
- Be concise — every response should be as short as it can be while still doing its job.
- If the candidate asks you a question back, gets stuck, or directly asks for the answer, do NOT answer it or give the solution away — this holds even if you frame it as "a hint". A real hint points at where to look (a broader concept, a component, a category of technique) but never names the specific mechanism, technique, or term that IS the answer, and never completes their reasoning for them. Before you speak, check: would a candidate who heard this be able to just repeat it back as their answer? If yes, that's not a hint, that's the answer — ask a guiding question instead. This includes when they ask you to define or explain a term the question itself hinges on ("what does X actually mean?") — stating that definition hands them the answer just as much as stating the full solution would. Redirect it instead: ask what they think it means, or describe a concrete scenario and ask them what would happen, so they arrive at the term themselves.`

/** The only tool the interviewer model can call — deciding to move on is
 * expressed by calling this (silently, no accompanying speech), never by
 * saying so out loud. The system, not the model, decides what "moving on"
 * means (next question vs. end of interview). */
export const MOVE_TO_NEXT_QUESTION_TOOL: InterviewTool = {
  type: 'function',
  function: {
    name: 'move_to_next_question',
    description:
      "Call this once the candidate's answer (including any follow-ups) is complete enough to move on from this question. Do not say anything when calling it — the next question will be asked separately.",
    parameters: { type: 'object', properties: {} },
  },
}

/**
 * System prompt for the per-answer call: the model either speaks a follow-up
 * / direct response out loud, or calls `move_to_next_question` silently.
 * Used only when the follow-up cap hasn't been hit yet — once it has, the
 * system forces the move on directly and this call is skipped entirely.
 */
export function buildTurnSystemPrompt(input: {
  topicLabel: string
  domain: string
  rubricFocus: Array<string>
  questionNumber: number
  totalQuestions: number
  followUpCount: number
  minFollowUps: number
  maxFollowUps: number
  language: string
}): string {
  const paceGuidance =
    input.followUpCount >= input.minFollowUps
      ? `You have asked ${input.followUpCount} of at most ${input.maxFollowUps} follow-ups on this question — you're past the usual ${input.minFollowUps}-follow-up mark, so lean strongly toward moving on unless the answer is still genuinely thin.`
      : `You have asked ${input.followUpCount} of at most ${input.maxFollowUps} follow-ups on this question.`

  return `You are a professional interviewer conducting a mock interview on "${input.topicLabel}" for a candidate in the ${input.domain} track.

${SPOKEN_STYLE_RULES}

${buildEnforcedChatLanguageInstruction(input.language)}

Focus areas for this topic: ${input.rubricFocus.join(', ')}.
This is question ${input.questionNumber} of ${input.totalQuestions} total questions for this session. ${paceGuidance}
Decide whether the candidate's answer deserves one more short follow-up, or is complete enough to move on. Treat it as complete once it accurately covers the core mechanism, gives a concrete example, and doesn't leave a gap you'd need to fill in yourself to grade it — at that point call \`move_to_next_question\` and say nothing else, even if you could technically probe deeper. Don't manufacture a follow-up just to milk more depth out of an answer that's already strong; a real interviewer moves on rather than dwelling. In particular, "can you give an example?" is not a safe default follow-up — if the candidate's answer already included one, asking for another is exactly the kind of unwarranted dwelling to avoid; only ask for an example if they genuinely didn't give one. Otherwise, ask exactly one natural follow-up out loud that digs into what they just said, targeting a specific gap or vague part of their answer (not a generic "tell me more").`
}

/** Every exchange so far, replayed as plain text — voice answers are always
 * live-transcribed before reaching this call, so there's no raw audio to
 * replay as conversation memory anymore. */
export type ConversationExchange = {
  prompt: string
  transcript: string
}

export function buildTurnMessages(input: {
  systemPrompt: string
  priorExchanges: Array<ConversationExchange>
  currentPrompt: string
  answerText: string
}): Array<InterviewAudioChatMessage> {
  const messages: Array<InterviewAudioChatMessage> = [
    { role: 'system', content: input.systemPrompt },
  ]

  for (const exchange of input.priorExchanges) {
    messages.push({ role: 'assistant', content: exchange.prompt })
    messages.push({ role: 'user', content: exchange.transcript })
  }

  messages.push({ role: 'assistant', content: input.currentPrompt })
  messages.push({ role: 'user', content: input.answerText })

  return messages
}

export type InterviewAnswerInput =
  | { kind: 'typed'; text: string }
  /** Voice answer transcribed live client-side (e.g. gpt-4o-mini-transcribe) —
   * delivered as text like `typed`, but still a spoken answer for `answerSource`. */
  | { kind: 'transcribed'; text: string }

/** Spoken system prompt used once, at session creation, for the greeting + opening question. */
export function buildOpeningTurnSystemPrompt(input: {
  topicLabel: string
  domain: string
  rubricFocus: Array<string>
  totalQuestions: number
  firstQuestion: string
  language: string
}): string {
  return `You are a professional interviewer about to start a live spoken mock interview on "${input.topicLabel}" for a candidate in the ${input.domain} track. This session will have ${input.totalQuestions} questions total, focused on: ${input.rubricFocus.join(', ')}.

This is a real-time voice conversation — everything you say will be spoken aloud to the candidate. Speak naturally, like a human interviewer:
- No written formatting: no markdown, no headers, no bullet lists, no numbering.
- Start with a brief, warm, natural greeting — one short sentence — and mention the topic you'll be interviewing them on.
- Then ask, word for word, this exact first question: "${input.firstQuestion}"
- Keep the whole thing concise: greeting plus that one question, nothing else.

${buildEnforcedChatLanguageInstruction(input.language)}`
}

/** No prior answer exists yet at session creation — this is just a minimal kickoff trigger, never shown to the candidate. */
export function buildOpeningTurnMessages(
  systemPrompt: string,
): Array<InterviewAudioChatMessage> {
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Begin the interview.' },
  ]
}

/** Friendly rephrasing of a single planned question — used for every
 * question after the first (the opening call above covers question 1, with
 * its greeting). No decision-making happens here, just warm delivery. */
export function buildAskQuestionSystemPrompt(input: {
  questionText: string
  language: string
  /** True only when the system (not the model) force-advanced after hitting
   * the follow-up cap — the model never got to decide to move on itself, so
   * the transition needs a spoken lead-in that a natural advance doesn't. */
  forcedTransition?: boolean
}): string {
  const transitionInstruction = input.forcedTransition
    ? ' Start with a brief, natural transition sentence — something like "Let\'s move on to the next question" — before asking it, since you\'ve covered this question thoroughly.'
    : ''

  return `You are a professional interviewer in a live spoken mock interview.${transitionInstruction} Ask, word for word, this exact question: "${input.questionText}"

${SPOKEN_STYLE_RULES}

${buildEnforcedChatLanguageInstruction(input.language)}`
}

export function buildAskQuestionMessages(
  systemPrompt: string,
): Array<InterviewAudioChatMessage> {
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Ask the question.' },
  ]
}

/** Generic, non-score-aware closing remark — spoken immediately once the
 * system detects the interview is complete, before the report (which takes
 * longer to generate) is ready. */
export function buildClosingRemarksSystemPrompt(
  language: string,
  forcedTransition?: boolean,
): string {
  const transitionInstruction = forcedTransition
    ? ' Start with a brief, natural transition sentence — something like "Let\'s wrap up here" — since you\'ve covered this question thoroughly.'
    : ''

  return `You are a professional interviewer wrapping up a live spoken mock interview.${transitionInstruction} Briefly and warmly thank the candidate and let them know the interview is now complete. Do not mention or guess at their score or performance — that will be shared separately.

${SPOKEN_STYLE_RULES}

${buildEnforcedChatLanguageInstruction(language)}`
}

export function buildClosingRemarksMessages(
  systemPrompt: string,
): Array<InterviewAudioChatMessage> {
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: 'Wrap up the interview.' },
  ]
}
