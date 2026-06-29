import type { AiChatHistoryEntry } from '@/server/api/ai-tutor/types/chatHistory'

export function buildLectureChatUserPrompt(input: {
  summary: string
  chatHistory: Array<AiChatHistoryEntry>
  question: string
}): string {
  const historyBlock =
    input.chatHistory.length > 0
      ? `Student bot chat history:\n${JSON.stringify(input.chatHistory)}\n`
      : ''

  return `${historyBlock}Lecture Summary:\n${input.summary}\n\nStudent's Question:\n${input.question}`
}
