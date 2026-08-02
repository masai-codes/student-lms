import type { OpenRouterChatMessage } from '@/server/api/interviews/clients/openRouterClient'
import { requestOpenRouterChatCompletion } from '@/server/api/interviews/clients/openRouterClient'

export type InterviewAudioChatMessage = OpenRouterChatMessage

export type InterviewAudioChatResult = {
  transcript: string
  nextQuestion: string | null
}

const RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'interview_turn',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        transcript: { type: 'string' },
        nextQuestion: { type: ['string', 'null'] },
      },
      required: ['transcript', 'nextQuestion'],
      additionalProperties: false,
    },
  },
} as const

function parseInterviewTurnResult(
  value: unknown,
): InterviewAudioChatResult | null {
  if (!value || typeof value !== 'object') return null
  const obj = value as Record<string, unknown>
  if (typeof obj.transcript !== 'string') return null
  if (obj.nextQuestion !== null && typeof obj.nextQuestion !== 'string') {
    return null
  }
  return { transcript: obj.transcript, nextQuestion: obj.nextQuestion ?? null }
}

export async function requestInterviewAudioChatTurn(input: {
  messages: Array<InterviewAudioChatMessage>
  model: string
}): Promise<InterviewAudioChatResult> {
  const content = await requestOpenRouterChatCompletion({
    messages: input.messages,
    model: input.model,
    responseFormat: RESPONSE_FORMAT,
  })

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(content)
  } catch {
    throw new Error('INTERVIEW_OPENROUTER_INVALID_RESPONSE')
  }

  const result = parseInterviewTurnResult(parsedJson)
  if (!result) {
    throw new Error('INTERVIEW_OPENROUTER_INVALID_RESPONSE')
  }
  return result
}
