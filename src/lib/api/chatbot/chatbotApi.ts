import { fetchJson } from '@/lib/api/fetchJson'
import { CHATBOT_API } from '@/lib/api/chatbot/chatbotPaths'
import type { ChatMode, SessionSummary, StoredMessage } from '@/components/features/chatbot/types'

export async function listChatbotSessions(lectureId: number): Promise<SessionSummary[]> {
  const data = await fetchJson<{ sessions: SessionSummary[] }>(CHATBOT_API.sessions(lectureId))
  return data.sessions
}

export async function createChatbotSession(
  lectureId: number,
  lastMode: ChatMode = 'voice',
): Promise<SessionSummary> {
  return fetchJson<SessionSummary>(CHATBOT_API.sessions(lectureId), {
    method: 'POST',
    body: JSON.stringify({ lastMode }),
  })
}

export async function patchChatbotSession(
  lectureId: number,
  sessionId: string,
  patch: { title?: string; lastMode?: ChatMode },
): Promise<SessionSummary> {
  return fetchJson<SessionSummary>(CHATBOT_API.session(lectureId, sessionId), {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
}

export async function getChatbotSessionMessages(
  lectureId: number,
  sessionId: string,
): Promise<StoredMessage[]> {
  const data = await fetchJson<{ messages: StoredMessage[] }>(
    CHATBOT_API.messages(lectureId, sessionId),
  )
  return data.messages
}

export async function appendChatbotSessionMessage(
  lectureId: number,
  sessionId: string,
  payload: {
    role: 'user' | 'assistant'
    content: string
    sourceType: string
    livekitId?: string | null
  },
): Promise<StoredMessage> {
  const data = await fetchJson<{ message: StoredMessage }>(
    CHATBOT_API.messages(lectureId, sessionId),
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
  return data.message
}

export async function createChatbotToken(payload: {
  lectureId: number
  mode: ChatMode
  sessionId: string
}): Promise<{
  serverUrl: string
  participantToken: string
  sessionId: string
}> {
  return fetchJson(CHATBOT_API.token(payload.lectureId), {
    method: 'POST',
    body: JSON.stringify({
      mode: payload.mode,
      sessionId: payload.sessionId,
    }),
  })
}

