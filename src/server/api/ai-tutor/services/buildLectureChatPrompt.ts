import type { AiChatHistoryEntry } from '@/server/api/ai-tutor/types/chatHistory'
import type { AiTutorChatLanguage } from '@/server/api/ai-tutor/chatLanguage'
import {
  AI_TUTOR_LECTURE_CHAT_DEFAULT_LANGUAGE_INSTRUCTION,
  AI_TUTOR_LECTURE_CHAT_RESPONSE_GUIDANCE,
  AI_TUTOR_LECTURE_CHAT_SYSTEM_PROMPT_BASE,
  buildEnforcedChatLanguageInstruction,
} from '@/server/api/ai-tutor/constants'

export type LectureChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export function buildLectureChatSystemPrompt(
  summary: string,
  language?: AiTutorChatLanguage,
): string {
  const languageInstruction = language
    ? buildEnforcedChatLanguageInstruction(language)
    : AI_TUTOR_LECTURE_CHAT_DEFAULT_LANGUAGE_INSTRUCTION

  return `${AI_TUTOR_LECTURE_CHAT_SYSTEM_PROMPT_BASE}

${languageInstruction}

${AI_TUTOR_LECTURE_CHAT_RESPONSE_GUIDANCE}

## Lecture content (summary)
${summary}`
}

export function buildLectureChatMessages(input: {
  chatHistory: Array<AiChatHistoryEntry>
  question: string
}): Array<LectureChatMessage> {
  const messages: Array<LectureChatMessage> = []

  for (const entry of input.chatHistory) {
    if (entry.userMessage) {
      messages.push({ role: 'user', content: entry.userMessage })
    }
    if (entry.aiMessage) {
      messages.push({ role: 'assistant', content: entry.aiMessage })
    }
  }

  messages.push({ role: 'user', content: input.question })

  return messages
}
