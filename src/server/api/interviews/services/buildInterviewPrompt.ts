import { buildEnforcedChatLanguageInstruction } from '@/server/api/ai-tutor/constants'
import type { InterviewAudioChatMessage } from '@/server/api/interviews/clients/openRouterAudioChat'

/** Shared "how to speak" ground rules for every spoken-turn system prompt below. */
const SPOKEN_STYLE_RULES = `This is a real-time voice conversation — everything you say will be spoken aloud to the candidate. Speak naturally, like a human interviewer:
- No written formatting: no markdown, no headers, no bullet lists, no numbering.
- Do not summarize, repeat, or transcribe the candidate's answer back to them.
- A brief natural acknowledgement ("Got it", "Interesting") is fine, but keep it short — spend your words on what you say next, not on recapping what they said.
- Ask exactly one question at a time. Never answer on the candidate's behalf.
- Be concise — every response should be as short as it can be while still doing its job.
- If the candidate asks you a question back, gets stuck, or directly asks for the answer, do NOT answer it or give the solution away. Offer at most a small nudge or hint that points them in the right direction, then let them keep working it out themselves.`

function buildContinuationInstruction(input: {
  questionNumber: number
  totalQuestions: number
  followUpCount: number
  maxFollowUps: number
  forced: boolean
  nextQuestionText: string | null
}): string {
  const isLastQuestion = input.nextQuestionText === null

  if (input.forced) {
    return isLastQuestion
      ? 'You have already asked the maximum number of follow-ups on this question. This is also the FINAL question of the interview. Do not ask anything else — briefly and warmly thank the candidate and let them know the interview is now complete.'
      : `You have already asked the maximum number of follow-ups on this question. Move on now: say a short, natural transition (e.g. "Alright, let's move on to the next question.") and then ask, word for word, this exact next question: "${input.nextQuestionText}"`
  }

  return isLastQuestion
    ? `Decide whether the candidate's answer deserves one more short follow-up (you have asked ${input.followUpCount} of at most ${input.maxFollowUps} follow-ups on this question) or is complete. If it's complete, this is the FINAL question of the interview — do not ask another question, instead briefly and warmly thank the candidate and let them know the interview is now complete. Otherwise ask exactly one natural follow-up that digs into what they just said.`
    : `Decide whether the candidate's answer deserves one more short follow-up (you have asked ${input.followUpCount} of at most ${input.maxFollowUps} follow-ups on this question) or is complete enough to move on. If it's complete, say a short natural transition (e.g. "Great, let's move on to the next question.") and then ask, word for word, this exact next question: "${input.nextQuestionText}". Otherwise ask exactly one natural follow-up that digs into what they just said (go deeper on a vague or weak answer, move on if it was already strong) — do NOT ask the next planned question as a follow-up.`
}

/**
 * Used only for `kind: 'audio'` answers, which go through one combined
 * audio-in/audio-out call that both hears the candidate and speaks its
 * response — there's no separate decision step, so this prompt has to cover
 * deciding AND speaking together.
 */
export function buildInterviewSystemPrompt(input: {
  topicLabel: string
  domain: string
  rubricFocus: Array<string>
  questionNumber: number
  totalQuestions: number
  followUpCount: number
  maxFollowUps: number
  forced: boolean
  nextQuestionText: string | null
  language: string
}): string {
  return `You are a professional interviewer conducting a live spoken mock interview on "${input.topicLabel}" for a candidate in the ${input.domain} track.

${SPOKEN_STYLE_RULES}

${buildEnforcedChatLanguageInstruction(input.language)}

Focus areas for this topic: ${input.rubricFocus.join(', ')}.
This is question ${input.questionNumber} of ${input.totalQuestions} total questions for this session.
${buildContinuationInstruction(input)}`
}

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

export type InterviewAnswerInput =
  | { kind: 'audio'; base64: string; format: 'wav' }
  | { kind: 'typed'; text: string }
  /** Voice answer transcribed live client-side (e.g. gpt-4o-mini-transcribe) —
   * delivered as text like `typed`, but still a spoken answer for `answerSource`. */
  | { kind: 'transcribed'; text: string }

/**
 * One exchange in the conversation replayed as context — either a question's
 * main answer or one of its follow-ups. Deliberately flat (no notion of
 * "turn" or "follow-up" survives here): from the model's point of view it's
 * just an ordered back-and-forth.
 */
export type ConversationExchange = {
  prompt: string
  transcript: string
  answerAudioBase64: string | null
}

/** Replays an exchange's answer as conversation memory — raw audio for voice answers, plain text for typed ones. */
function exchangeAnswerContent(
  exchange: ConversationExchange,
): InterviewAudioChatMessage['content'] {
  if (exchange.answerAudioBase64) {
    return [
      {
        type: 'input_audio',
        input_audio: { data: exchange.answerAudioBase64, format: 'wav' },
      },
    ]
  }
  return [{ type: 'text', text: exchange.transcript }]
}

export function buildInterviewMessages(input: {
  systemPrompt: string
  priorExchanges: Array<ConversationExchange>
  currentPrompt: string
  answer: InterviewAnswerInput
}): Array<InterviewAudioChatMessage> {
  const messages: Array<InterviewAudioChatMessage> = [
    { role: 'system', content: input.systemPrompt },
  ]

  for (const exchange of input.priorExchanges) {
    messages.push({ role: 'assistant', content: exchange.prompt })
    messages.push({ role: 'user', content: exchangeAnswerContent(exchange) })
  }

  messages.push({ role: 'assistant', content: input.currentPrompt })

  messages.push({
    role: 'user',
    content:
      input.answer.kind === 'typed' || input.answer.kind === 'transcribed'
        ? [{ type: 'text', text: input.answer.text }]
        : [
            {
              type: 'input_audio',
              input_audio: {
                data: input.answer.base64,
                format: input.answer.format,
              },
            },
          ],
  })

  return messages
}

export type InterviewTurnAction = 'follow_up' | 'advance' | 'end_interview'

/**
 * Text-only classification of a just-spoken audio-turn response, used only
 * for `kind: 'audio'` answers — those go through one combined audio-in/
 * audio-out call (`buildInterviewMessages` above) that decides AND speaks in
 * the same breath, so there's no separate structured decision to read. This
 * reads the resulting spoken transcript back and classifies which of the
 * three outcomes it represents, so the turn can be persisted correctly.
 */
export function buildClassifyActionMessages(input: {
  spokenText: string
  isLastQuestion: boolean
}): Array<InterviewAudioChatMessage> {
  const system = `You classify one line of spoken interviewer dialogue from a mock interview into exactly one category. Respond with ONLY the category word, nothing else:
- follow_up — it asks a probing question about the answer the candidate just gave, without introducing a new top-level topic.
- advance — it moves on to a new, different interview question.
- end_interview — it thanks the candidate and closes out the interview, asking nothing further.
${input.isLastQuestion ? 'This is the final planned question, so "advance" is not a valid answer — treat anything that is not a follow-up as end_interview.' : ''}`

  return [
    { role: 'system', content: system },
    { role: 'user', content: input.spokenText },
  ]
}

export function parseClassifiedAction(
  raw: string,
  isLastQuestion: boolean,
): InterviewTurnAction {
  const normalized = raw.trim().toLowerCase()
  if (normalized.includes('follow_up') || normalized.includes('follow-up')) {
    return 'follow_up'
  }
  if (
    normalized.includes('end_interview') ||
    normalized.includes('end interview')
  ) {
    return 'end_interview'
  }
  if (isLastQuestion) return 'end_interview'
  return 'advance'
}

export type InterviewTurnDecision = {
  action: InterviewTurnAction
  /** For `follow_up`: the follow-up question itself. For `advance`: just a
   * short transition line — the next question's fixed text is appended
   * separately, verbatim, rather than regenerated. For `end_interview`: the
   * closing remarks. */
  text: string
}

/**
 * Text-in/text-out decision call for answers that already arrive as text
 * (`typed` or `transcribed`, e.g. via live client-side STT) — decides the
 * next action AND drafts exactly what the interviewer should say, in one
 * plain-text-formatted response (no `input_audio` involved, so no audio-out
 * call is needed to make the decision itself).
 */
export function buildDecisionSystemPrompt(input: {
  topicLabel: string
  domain: string
  rubricFocus: Array<string>
  questionNumber: number
  totalQuestions: number
  followUpCount: number
  maxFollowUps: number
  forced: boolean
  language: string
}): string {
  const isLastQuestion = input.questionNumber >= input.totalQuestions

  return `You are a professional interviewer conducting a mock interview on "${input.topicLabel}" for a candidate in the ${input.domain} track. Focus areas: ${input.rubricFocus.join(', ')}.
This is question ${input.questionNumber} of ${input.totalQuestions} total questions. You have asked ${input.followUpCount} of at most ${input.maxFollowUps} follow-ups on this question.
${
  input.forced
    ? isLastQuestion
      ? 'You must NOT ask a follow-up (the follow-up limit was reached) — this is also the final question, so close out the interview.'
      : 'You must NOT ask a follow-up (the follow-up limit was reached) — advance to the next question.'
    : isLastQuestion
      ? "Decide whether the candidate's answer deserves one more short follow-up, or is complete enough to close out the interview (this is the final question)."
      : "Decide whether the candidate's answer deserves one more short follow-up, or is complete enough to advance to the next question."
}

Be concise in TEXT — as short as possible while still doing its job. If the candidate asked you a question back, got stuck, or asked for the answer outright, do NOT answer it or give the solution away in TEXT — offer at most a small nudge or hint and let them keep working it out themselves.

${buildEnforcedChatLanguageInstruction(input.language)}

Respond in EXACTLY this plain-text format and nothing else:
ACTION: follow_up | advance | end_interview
TEXT: <what the interviewer should say next, spoken naturally>
- If ACTION is follow_up: TEXT is the follow-up question itself — no markdown, no recapping the candidate's answer, one question at a time.
- If ACTION is advance: TEXT is ONLY a short natural transition line (e.g. "Great, let's move on to the next question.") — do NOT include the next question's text, it will be asked separately, verbatim.
- If ACTION is end_interview: TEXT is a brief, warm closing remark.

${input.forced ? `ACTION must be ${isLastQuestion ? 'end_interview' : 'advance'}.` : ''}`
}

export function buildDecisionMessages(input: {
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

export function parseDecision(
  raw: string,
  isLastQuestion: boolean,
): InterviewTurnDecision {
  const actionMatch = raw.match(
    /ACTION\s*:\s*(follow_up|advance|end_interview)/i,
  )
  const textMatch = raw.match(/TEXT\s*:\s*([\s\S]*)$/i)

  let action =
    (actionMatch?.[1].toLowerCase() as InterviewTurnAction) ?? 'advance'
  if (isLastQuestion && action === 'advance') action = 'end_interview'

  const text = textMatch?.[1].trim() ?? raw.trim()
  return { action, text }
}

/** Instructs the audio-out model to speak an already-decided line of text
 * verbatim, rather than deciding what to say itself — used after a text-based
 * decision call has already produced the exact wording. */
export function buildSpeakExactMessages(
  text: string,
): Array<InterviewAudioChatMessage> {
  return [
    {
      role: 'system',
      content:
        'You are a professional interviewer in a live spoken mock interview. Speak the exact line the user gives you, naturally and warmly, as if saying it for the first time. Do not add, remove, or rephrase anything.',
    },
    { role: 'user', content: text },
  ]
}
