import {
  type AiTutorFeedbackPlatform,
  isAiTutorFeedbackPlatform,
} from '@/server/api/ai-tutor/feedbackPlatform'
import type { AiTutorChatLanguage } from '@/server/api/ai-tutor/chatLanguage'
import { parseStoredChatLanguage } from '@/server/api/ai-tutor/chatLanguage'

/** One persisted turn in `ai_chat_practice_questions.chatHistory`. */
export type AiChatHistoryEntry = {
  userMessage: string
  aiMessage: string
  platform?: AiTutorFeedbackPlatform
  language?: AiTutorChatLanguage
}

export function parseChatHistory(value: unknown): Array<AiChatHistoryEntry> {
  if (!Array.isArray(value)) return []

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const row = entry as Record<string, unknown>
    const userMessage =
      typeof row.userMessage === 'string' ? row.userMessage : ''
    const aiMessage = typeof row.aiMessage === 'string' ? row.aiMessage : ''
    if (!userMessage && !aiMessage) return []

    const platformValue = row.platform
    const platform = isAiTutorFeedbackPlatform(platformValue)
      ? platformValue
      : undefined

    const language = parseStoredChatLanguage(row.language)

    return [
      {
        userMessage,
        aiMessage,
        ...(platform ? { platform } : {}),
        ...(language ? { language } : {}),
      },
    ]
  })
}
