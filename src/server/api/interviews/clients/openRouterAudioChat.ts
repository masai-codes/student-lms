import type { OpenRouterChatMessage } from '@/server/api/interviews/clients/openRouterClient'
import {
  requestOpenRouterChatCompletion,
  requestOpenRouterChatCompletionStream,
} from '@/server/api/interviews/clients/openRouterClient'
import { createIncrementalJsonStringExtractor } from '@/server/api/interviews/clients/jsonStringFieldExtractor'

export type InterviewAudioChatMessage = OpenRouterChatMessage

export type InterviewAudioChatResult = {
  transcript: string
  nextQuestion: string | null
}

export type InterviewAudioChatStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'result'; result: InterviewAudioChatResult }

// `nextQuestion` is declared first — the only field callers show/speak live
// — so a strict-JSON-schema model emits it before the (silent) `transcript`
// field, minimizing how much of the stream we scan before deltas start.
const RESPONSE_FORMAT = {
  type: 'json_schema',
  json_schema: {
    name: 'interview_turn',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        nextQuestion: { type: ['string', 'null'] },
        transcript: { type: 'string' },
      },
      required: ['nextQuestion', 'transcript'],
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

/**
 * Streaming counterpart of `requestInterviewAudioChatTurn` — yields
 * `nextQuestion` text deltas as the model generates them (see
 * `jsonStringFieldExtractor`), then a final validated `result` once the full
 * JSON document has arrived. The final `result` is always the source of
 * truth (from a real `JSON.parse`); the deltas are only a live preview.
 */
export async function* requestInterviewAudioChatTurnStream(input: {
  messages: Array<InterviewAudioChatMessage>
  model: string
}): AsyncGenerator<InterviewAudioChatStreamEvent> {
  const extractor = createIncrementalJsonStringExtractor('nextQuestion')
  let raw = ''

  for await (const chunk of requestOpenRouterChatCompletionStream({
    messages: input.messages,
    model: input.model,
    responseFormat: RESPONSE_FORMAT,
  })) {
    raw += chunk
    for (const event of extractor.push(chunk)) {
      if (event.type === 'delta') yield { type: 'delta', text: event.text }
    }
  }

  let parsedJson: unknown
  try {
    parsedJson = JSON.parse(raw)
  } catch {
    throw new Error('INTERVIEW_OPENROUTER_INVALID_RESPONSE')
  }

  const result = parseInterviewTurnResult(parsedJson)
  if (!result) {
    throw new Error('INTERVIEW_OPENROUTER_INVALID_RESPONSE')
  }
  yield { type: 'result', result }
}
