import type { AiTutorChatTurn } from '@/server/api/ai-tutor/types/conversation'
import type { AiChatHistoryEntry } from '@/server/api/ai-tutor/types/chatHistory'
import {
  AI_TUTOR_CONVERSATION_TITLE_MAX_LENGTH,
  AI_TUTOR_DEFAULT_CONVERSATION_TITLE,
} from '@/server/api/ai-tutor/constants'

export function deriveConversationTitle(
  history: Array<AiChatHistoryEntry>,
): string {
  const firstUserMessage = history
    .map((entry) => entry.userMessage.trim())
    .find((message) => message.length > 0)

  if (!firstUserMessage) {
    return AI_TUTOR_DEFAULT_CONVERSATION_TITLE
  }

  if (firstUserMessage.length <= AI_TUTOR_CONVERSATION_TITLE_MAX_LENGTH) {
    return firstUserMessage
  }

  return `${firstUserMessage.slice(0, AI_TUTOR_CONVERSATION_TITLE_MAX_LENGTH - 1)}…`
}

export function chatHistoryToTurns(
  history: Array<AiChatHistoryEntry>,
): Array<AiTutorChatTurn> {
  const turns: Array<AiTutorChatTurn> = []

  for (const entry of history) {
    if (entry.userMessage) {
      turns.push({ role: 'user', content: entry.userMessage })
    }
    if (entry.aiMessage || entry.practiceQuestions) {
      turns.push({
        role: 'assistant',
        content: entry.aiMessage,
        ...(entry.practiceQuestions
          ? { practiceQuestions: entry.practiceQuestions }
          : {}),
      })
    }
  }

  return turns
}
