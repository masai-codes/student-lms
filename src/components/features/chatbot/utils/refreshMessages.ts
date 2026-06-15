import { getChatbotSessionMessages } from '@/lib/api/chatbot/chatbotApi'
import type { StoredMessage } from '@/components/features/chatbot/types'

export const PERSIST_SETTLE_MS = 800

export async function refreshSessionMessages(
  lectureId: number,
  sessionId: string,
): Promise<StoredMessage[]> {
  await new Promise((resolve) => window.setTimeout(resolve, PERSIST_SETTLE_MS))
  return getChatbotSessionMessages(lectureId, sessionId)
}

