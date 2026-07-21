import type {
  AiChatMessage,
  SendAiChatMessageResult,
} from '@/server/ai-chat/types'
import { ApiClientError } from '@/lib/api/apiClientError'
import { fetchJson } from '@/lib/api/fetchJson'
import { LEARN_API } from '@/lib/api/learnPaths'

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await fetchJson<T>(path, init)
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new Error(error.code)
    }
    throw error
  }
}

export async function sendAiChatMessageRequest(input: {
  lectureId: number
  message: string
}): Promise<SendAiChatMessageResult> {
  return call<SendAiChatMessageResult>(LEARN_API.aiChatSend(input.lectureId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: input.message }),
  })
}

export async function fetchAiChatHistoryRequest(
  lectureId: number,
): Promise<Array<AiChatMessage>> {
  const result = await call<{ messages: Array<AiChatMessage> }>(
    LEARN_API.aiChatHistory(lectureId),
    { method: 'GET' },
  )
  return result.messages
}
