import type { DisplayMessage } from '@/components/features/chatbot/types'

export type VoiceSubtitle = {
  role: 'user' | 'assistant'
  text: string
  streamId: string
}

export function isAgentParticipant(identity: string, localIdentity: string): boolean {
  if (identity === localIdentity) {
    return false
  }
  return /agent|tutor|ai/i.test(identity)
}

/** Last non-empty display message, matching text-chat merge order. */
export function selectVoiceSubtitle(messages: DisplayMessage[]): VoiceSubtitle | null {
  const last = messages.at(-1)
  if (!last) {
    return null
  }

  const text = last.content.trim()
  if (!text) {
    return null
  }

  return {
    role: last.role,
    text,
    streamId: last.id,
  }
}
