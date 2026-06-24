import { listChatPracticeConversations } from '@/server/api/ai-tutor/services/aiChatPracticeQuestions.service'
import type { ListAiTutorConversationsResponse } from '@/server/api/ai-tutor/types/conversation'
import { deriveConversationTitle } from '@/server/api/ai-tutor/utils/chatTurns'

export async function listAiTutorConversations(input: {
  userId: number
  lectureId: number
}): Promise<ListAiTutorConversationsResponse> {
  const rows = await listChatPracticeConversations(input)

  return {
    conversations: rows.map((row) => ({
      chatId: row.id,
      title: deriveConversationTitle(row.chatHistory),
      updatedAt: row.updatedAt,
    })),
  }
}
