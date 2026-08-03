import type { InterviewAudioChatMessage } from '@/server/api/interviews/clients/openRouterAudioChat'
import type { InterviewTurn } from '@/server/api/interviews/types/interviewSession'

export function buildInterviewSystemPrompt(input: {
  topicLabel: string
  domain: string
  rubricFocus: Array<string>
  questionNumber: number
  totalQuestions: number
}): string {
  const isLastQuestion = input.questionNumber >= input.totalQuestions
  const continuation = isLastQuestion
    ? 'This is the FINAL question of the interview. Do not ask another question — instead, briefly and warmly thank the candidate and let them know the interview is now complete.'
    : `Ask question ${input.questionNumber + 1} of ${input.totalQuestions} next — a natural follow-up that adapts to what the candidate actually said (go deeper on a vague or weak answer, move on if it was strong).`

  return `You are a professional interviewer conducting a live spoken mock interview on "${input.topicLabel}" for a candidate in the ${input.domain} track.

This is a real-time voice conversation — everything you say will be spoken aloud to the candidate. Speak naturally, like a human interviewer:
- No written formatting: no markdown, no headers, no bullet lists, no numbering.
- Do not summarize, repeat, or transcribe the candidate's answer back to them.
- A brief natural acknowledgement ("Got it", "Interesting") is fine, but keep it short — spend your words on what you say next, not on recapping what they said.
- Ask exactly one question at a time. Never answer on the candidate's behalf.

Focus areas for this topic: ${input.rubricFocus.join(', ')}.
This is question ${input.questionNumber} of ${input.totalQuestions} total questions for this session.
${continuation}`
}

/** Spoken system prompt used once, at session creation, for the greeting + opening question. */
export function buildOpeningTurnSystemPrompt(input: {
  topicLabel: string
  domain: string
  rubricFocus: Array<string>
  totalQuestions: number
}): string {
  return `You are a professional interviewer about to start a live spoken mock interview on "${input.topicLabel}" for a candidate in the ${input.domain} track. This session will have ${input.totalQuestions} questions total, focused on: ${input.rubricFocus.join(', ')}.

This is a real-time voice conversation — everything you say will be spoken aloud to the candidate. Speak naturally, like a human interviewer:
- No written formatting: no markdown, no headers, no bullet lists, no numbering.
- Start with a brief, warm, natural greeting — one short sentence — and mention the topic you'll be interviewing them on.
- Then ask your first question, question 1 of ${input.totalQuestions}.
- Keep the whole thing concise: greeting plus one question, nothing else.`
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

/** Replays a turn's answer as conversation memory — raw audio for voice answers, plain text for typed ones. */
function answeredTurnContent(
  turn: InterviewTurn,
): InterviewAudioChatMessage['content'] {
  if (turn.answerAudioBase64) {
    return [
      {
        type: 'input_audio',
        input_audio: { data: turn.answerAudioBase64, format: 'wav' },
      },
    ]
  }
  return [{ type: 'text', text: turn.transcript }]
}

export function buildInterviewMessages(input: {
  systemPrompt: string
  priorTurns: Array<InterviewTurn>
  currentQuestion: string
  answer: InterviewAnswerInput
}): Array<InterviewAudioChatMessage> {
  const messages: Array<InterviewAudioChatMessage> = [
    { role: 'system', content: input.systemPrompt },
  ]

  for (const turn of input.priorTurns) {
    messages.push({ role: 'assistant', content: turn.question })
    messages.push({ role: 'user', content: answeredTurnContent(turn) })
  }

  messages.push({ role: 'assistant', content: input.currentQuestion })

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
