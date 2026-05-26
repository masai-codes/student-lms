import type {
  AiChatHistoryEntry,
  AiChatMessage,
  AiChatRole,
} from '@/server/ai-chat/types'

/**
 * Expands persisted history entries into the flat client-facing message list.
 * Text turns become two messages (user + assistant). Audio entries become a
 * single message each. IDs are deterministic so re-renders stay stable.
 */
export function projectHistoryToMessages(
  history: ReadonlyArray<AiChatHistoryEntry>,
  rowId: number,
): Array<AiChatMessage> {
  const messages: Array<AiChatMessage> = []

  history.forEach((entry, idx) => {
    switch (entry.type) {
      case 'text': {
        messages.push({
          id: `text-${rowId}-${idx}-u`,
          role: 'user',
          content: entry.userMessage,
          source: 'text',
          timestamp: entry.timestamp,
        })
        messages.push({
          id: `text-${rowId}-${idx}-a`,
          role: 'assistant',
          content: entry.aiMessage,
          source: 'text',
          // Assistant always rendered after its paired user message.
          timestamp: entry.timestamp + 1,
        })
        break
      }
      case 'audio_chat_student_speaking': {
        messages.push({
          id: `audio-${rowId}-${idx}`,
          role: 'user',
          content: entry.content,
          source: 'voice',
          timestamp: entry.timestamp,
        })
        break
      }
      case 'audio_chat_ai_response': {
        messages.push({
          id: `audio-${rowId}-${idx}`,
          role: 'assistant',
          content: entry.content,
          source: 'voice',
          timestamp: entry.timestamp,
        })
        break
      }
    }
  })

  return messages
}

/**
 * Same history but in the `{role, content}` shape used both for OpenAI prompt
 * context and for handing prior conversation context to the LiveKit token
 * server when starting a voice session.
 */
export function projectHistoryToPromptTurns(
  history: ReadonlyArray<AiChatHistoryEntry>,
): Array<{ role: AiChatRole; content: string }> {
  const turns: Array<{ role: AiChatRole; content: string }> = []

  for (const entry of history) {
    switch (entry.type) {
      case 'text':
        turns.push({ role: 'user', content: entry.userMessage })
        turns.push({ role: 'assistant', content: entry.aiMessage })
        break
      case 'audio_chat_student_speaking':
        turns.push({ role: 'user', content: entry.content })
        break
      case 'audio_chat_ai_response':
        turns.push({ role: 'assistant', content: entry.content })
        break
    }
  }

  return turns
}
