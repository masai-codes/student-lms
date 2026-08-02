import type { OpenRouterChatMessage } from '@/server/api/interviews/clients/openRouterClient'
import { requestOpenRouterAudioStream } from '@/server/api/interviews/clients/openRouterClient'

export type InterviewAudioChatMessage = OpenRouterChatMessage

/** Fixed interviewer voice — not user-configurable, matches product intent of a single consistent interviewer persona. */
const INTERVIEW_VOICE = 'alloy'

export type InterviewTurnAudioEvent =
  | { type: 'audio'; data: string }
  | { type: 'final'; spokenText: string }

/**
 * Single audio-in/audio-out call: the model hears the candidate's answer (or
 * reads their typed answer) and speaks its response directly — either the
 * next question or a closing remark on the final turn. Streams the spoken
 * audio as it's generated; the accompanying spoken-text deltas (required
 * alongside audio by the API, but never shown to the candidate) are
 * accumulated server-side into a final `spokenText`, which becomes the next
 * turn's stored question text.
 */
export async function* requestInterviewTurnAudioStream(input: {
  messages: Array<InterviewAudioChatMessage>
  model: string
}): AsyncGenerator<InterviewTurnAudioEvent> {
  let spokenText = ''

  for await (const event of requestOpenRouterAudioStream({
    messages: input.messages,
    model: input.model,
    voice: INTERVIEW_VOICE,
    format: 'pcm16',
  })) {
    if (event.type === 'audio') {
      yield { type: 'audio', data: event.data }
    } else {
      spokenText += event.text
    }
  }

  yield { type: 'final', spokenText: spokenText.trim() }
}
