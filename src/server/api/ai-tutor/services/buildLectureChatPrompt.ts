import type { AiChatHistoryEntry } from '@/server/api/ai-tutor/types/chatHistory'
import { AI_TUTOR_LECTURE_CHAT_SYSTEM_PROMPT } from '@/server/api/ai-tutor/constants'

export type LectureChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export function buildLectureChatSystemPrompt(summary: string): string {
  return `${AI_TUTOR_LECTURE_CHAT_SYSTEM_PROMPT}

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
