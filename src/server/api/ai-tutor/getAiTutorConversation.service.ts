import type { GetAiTutorConversationResponse } from '@/server/api/ai-tutor/types/conversation'
import { getChatPracticeConversation } from '@/server/api/ai-tutor/services/aiChatPracticeQuestions.service'
import { chatHistoryToTurns } from '@/server/api/ai-tutor/utils/chatTurns'

export async function getAiTutorConversation(input: {
  userId: number
  chatId: number
}): Promise<GetAiTutorConversationResponse> {
  const row = await getChatPracticeConversation(input)

  return {
    chatId: row.id,
    chat: chatHistoryToTurns(row.chatHistory),
  }
}
