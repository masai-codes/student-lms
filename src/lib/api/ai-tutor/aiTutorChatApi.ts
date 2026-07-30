import { fetchJson } from '@/lib/api/fetchJson'
import { AI_TUTOR_API } from '@/lib/api/ai-tutor/aiTutorPaths'
import type {
  GetAiTutorConversationResponse,
  ListAiTutorConversationsResponse,
} from '@/server/api/ai-tutor/types/conversation'

export type {
  AiTutorConversationSummary,
  GetAiTutorConversationResponse,
  ListAiTutorConversationsResponse,
} from '@/server/api/ai-tutor/types/conversation'

export async function listAiTutorConversations(
  lectureId: number,
): Promise<ListAiTutorConversationsResponse> {
  const params = new URLSearchParams({ lectureId: String(lectureId) })
  return fetchJson<ListAiTutorConversationsResponse>(
    `${AI_TUTOR_API.conversations}?${params.toString()}`,
  )
}

export async function getAiTutorConversation(
  chatId: number,
): Promise<GetAiTutorConversationResponse> {
  return fetchJson<GetAiTutorConversationResponse>(
    AI_TUTOR_API.conversation(chatId),
  )
}
