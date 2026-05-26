import type {
  AiTutorLimitStatus,
  AiTutorSession,
  AiTutorTranscriptSession,
} from '@/server/ai-tutor/types'
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

export async function createAiTutorSessionRequest(
  lectureId: number,
  language = 'English',
): Promise<AiTutorSession> {
  const result = await call<{ session: AiTutorSession }>(
    LEARN_API.aiTutorSession(lectureId),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language }),
    },
  )
  return result.session
}

export async function dispatchAiTutorAgentRequest(
  lectureId: number,
  roomName: string,
): Promise<void> {
  await call<{ success: boolean }>(LEARN_API.aiTutorDispatch(lectureId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomName }),
  })
}

export async function endAiTutorSessionRequest(sessionId: string): Promise<void> {
  await call<{ success: boolean }>(LEARN_API.aiTutorEnd, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId }),
  })
}

export async function fetchAiTutorTranscriptRequest(
  lectureId: number,
): Promise<Array<AiTutorTranscriptSession>> {
  const result = await call<{ sessions: Array<AiTutorTranscriptSession> }>(
    LEARN_API.aiTutorTranscript(lectureId),
    { method: 'GET' },
  )
  return result.sessions
}

export async function fetchAiTutorLimitRequest(): Promise<AiTutorLimitStatus> {
  return call<AiTutorLimitStatus>(LEARN_API.aiTutorLimit, { method: 'GET' })
}

export async function submitAiTutorFeedbackRequest(input: {
  lectureId: number
  rating: number
  feedback?: string
}): Promise<void> {
  await call<{ success: boolean }>(LEARN_API.aiTutorFeedback(input.lectureId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rating: input.rating,
      ...(input.feedback ? { feedback: input.feedback } : {}),
    }),
  })
}

export function endAiTutorSessionWithBeacon(sessionId: string): boolean {
  if (typeof navigator === 'undefined') return false
  const payload = JSON.stringify({ sessionId })
  return navigator.sendBeacon(
    LEARN_API.aiTutorEnd,
    new Blob([payload], { type: 'application/json' }),
  )
}
