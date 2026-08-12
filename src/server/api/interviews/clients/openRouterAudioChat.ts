import type {
  OpenRouterChatMessage,
  OpenRouterTool,
} from '@/server/api/interviews/clients/openRouterClient'
import { requestOpenRouterAudioStream } from '@/server/api/interviews/clients/openRouterClient'

export type InterviewAudioChatMessage = OpenRouterChatMessage
export type InterviewTool = OpenRouterTool

/** Fixed interviewer voice — not user-configurable, matches product intent of a single consistent interviewer persona. */
const INTERVIEW_VOICE = 'alloy'

export type InterviewTurnAudioEvent =
  | { type: 'audio'; data: string }
  /** The spoken text accumulated so far, re-emitted on every incoming
   * transcript delta — lets callers show the response building up on screen
   * without waiting for the full audio to finish streaming. */
  | { type: 'transcript'; textSoFar: string }
  | { type: 'final'; spokenText: string }
  | { type: 'tool_call'; name: string }

/**
 * A single call that either speaks the interviewer's response directly
 * (audio, streamed as it's generated, with a final `spokenText` transcript
 * once done) or — when `tools` is passed and the model decides to call one —
 * yields a silent `tool_call` event instead. The two are mutually exclusive
 * within one call: a tool call never carries spoken audio alongside it.
 */
export async function* requestInterviewTurnAudioStream(input: {
  messages: Array<InterviewAudioChatMessage>
  model: string
  tools?: Array<InterviewTool>
}): AsyncGenerator<InterviewTurnAudioEvent> {
  let spokenText = ''

  for await (const event of requestOpenRouterAudioStream({
    messages: input.messages,
    model: input.model,
    voice: INTERVIEW_VOICE,
    format: 'pcm16',
    tools: input.tools,
  })) {
    if (event.type === 'audio') {
      yield { type: 'audio', data: event.data }
    } else if (event.type === 'tool_call') {
      yield { type: 'tool_call', name: event.name }
      return
    } else {
      spokenText += event.text
      yield { type: 'transcript', textSoFar: spokenText }
    }
  }

  yield { type: 'final', spokenText: spokenText.trim() }
}
