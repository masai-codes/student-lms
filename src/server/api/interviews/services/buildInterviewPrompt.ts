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
    ? 'This is the FINAL question of the interview. After transcribing the answer, set "nextQuestion" to null to end the interview — do not ask another question.'
    : `After transcribing the answer, ask question ${input.questionNumber + 1} of ${input.totalQuestions} as "nextQuestion" — a natural follow-up that adapts to what the candidate actually said (go deeper on a vague or weak answer, move on if it was strong).`

  return `You are a professional interviewer conducting a mock interview on "${input.topicLabel}" for a candidate in the ${input.domain} track.

Rules:
- Ask exactly one question at a time. Never answer on the candidate's behalf.
- Focus areas for this topic: ${input.rubricFocus.join(', ')}.
- The candidate's answer arrives as spoken audio (or, if their microphone is unavailable, as typed text). Transcribe it VERBATIM — the candidate's exact words, no summarizing, no cleaning up filler words, in whatever language they spoke. This transcript is shown back to the candidate as a fairness check, so accuracy matters more than polish. For typed answers, "transcript" is simply the typed text unchanged.
- This is question ${input.questionNumber} of ${input.totalQuestions} total questions for this session.
- ${continuation}
- Respond ONLY with a JSON object matching the required schema: { "transcript": string, "nextQuestion": string | null }.`
}

/** Text-only prompt used once, at session creation, to generate the opening question. */
export function buildFirstQuestionPrompt(input: {
  topicLabel: string
  domain: string
  rubricFocus: Array<string>
  totalQuestions: number
}): string {
  return `You are a professional interviewer conducting a mock interview on "${input.topicLabel}" for a candidate in the ${input.domain} track. This session will have ${input.totalQuestions} questions total, focused on: ${input.rubricFocus.join(', ')}.

Write ONLY the opening interview question — a single, clear, welcoming question that starts the interview on this topic. No preamble, no numbering, just the question text itself.`
}

export type InterviewAnswerInput =
  | { kind: 'audio'; base64: string; format: 'wav' }
  | { kind: 'typed'; text: string }

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
    messages.push({ role: 'user', content: turn.transcript })
  }

  messages.push({ role: 'assistant', content: input.currentQuestion })

  if (input.answer.kind === 'typed') {
    messages.push({
      role: 'user',
      content: [{ type: 'text', text: input.answer.text }],
    })
  } else {
    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'The candidate answered by voice. Transcribe verbatim, then continue the interview.',
        },
        {
          type: 'input_audio',
          input_audio: {
            data: input.answer.base64,
            format: input.answer.format,
          },
        },
      ],
    })
  }

  return messages
}
