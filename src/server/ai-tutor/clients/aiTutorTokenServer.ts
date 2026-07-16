/**
 * Thin HTTP client for the Python LiveKit token server. The token server is
 * referenced by `LIVEKIT_TOKEN_SERVER_URL` and exposes:
 *   POST /generate-session   → { session_id, room_name, url, token, ... }
 *   POST /dispatch           → { ok }
 *   POST /end                → { ok }
 *   GET  /transcript/:sid    → { transcript: [...] }
 *
 * Talks to the service directly so the new LMS no longer needs the legacy
 * `experience-api` as a middleman.
 */

const DEFAULT_TIMEOUT_MS = 15_000

export type TokenServerSession = {
  session_id: string
  room_name: string
  url: string
  token: string
  duration_minutes: number
  participant_name: string
  unique_id: string
}

export type TokenServerTranscriptEntry = {
  role: 'assistant' | 'user'
  content: string
  timestamp: string
  action_type?: string
}

export type TokenServerTranscriptResponse = {
  transcript: Array<TokenServerTranscriptEntry>
  total_entries?: number
}

function getTokenServerBaseUrl(): string {
  const base = process.env.TOKEN_SERVER_URL?.trim().replace(/\/+$/, '') || ''
  if (!base) {
    throw new Error('AI_TUTOR_TOKEN_SERVER_NOT_CONFIGURED')
  }
  return base
}

function getTokenServerTimeoutMs(): number {
  const raw = process.env.TOKEN_SERVER_TIMEOUT_MS
  const parsed = raw ? Number(raw) : Number.NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS
}

async function tokenServerFetch(
  path: string,
  init: RequestInit,
  failureCode: string,
): Promise<Response> {
  const base = getTokenServerBaseUrl()
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    getTokenServerTimeoutMs(),
  )
  try {
    const response = await fetch(`${base}${path}`, {
      ...init,
      signal: controller.signal,
    })
    if (!response.ok) {
      throw new Error(failureCode)
    }
    return response
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('AI_TUTOR_TOKEN_SERVER_TIMEOUT')
    }
    if (error instanceof Error && error.message === failureCode) throw error
    throw new Error(failureCode)
  } finally {
    clearTimeout(timeout)
  }
}

export type GenerateSessionInput = {
  participantName: string
  language: string
  uniqueId: string
  lectureId: number
  lectureTranscript: string
  durationMinutes: number
  /**
   * Prior chat history for this (user, lecture), flattened to `{role, content}`.
   * When non-empty we forward it as `chat_history` so the voice agent can
   * resume the existing thread instead of starting fresh.
   */
  chatHistory?: ReadonlyArray<{ role: 'user' | 'assistant'; content: string }>
}

export async function generateSessionOnTokenServer(
  input: GenerateSessionInput,
): Promise<TokenServerSession> {
  const includeChatHistory = (input.chatHistory ?? []).length > 0
  const response = await tokenServerFetch(
    '/generate-session',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantName: input.participantName,
        language: input.language,
        unique_id: input.uniqueId,
        lecture_id: input.lectureId.toString(),
        lecture_transcript: input.lectureTranscript,
        duration_minutes: input.durationMinutes,
        ...(includeChatHistory ? { chat_history: input.chatHistory } : {}),
      }),
    },
    'AI_TUTOR_TOKEN_SERVER_GENERATE_FAILED',
  )

  const data = (await response
    .json()
    .catch(() => null)) as Partial<TokenServerSession> | null

  if (
    !data ||
    !data.session_id ||
    !data.room_name ||
    !data.url ||
    !data.token ||
    !data.unique_id ||
    !data.participant_name
  ) {
    throw new Error('AI_TUTOR_TOKEN_SERVER_INVALID_RESPONSE')
  }

  return {
    session_id: data.session_id,
    room_name: data.room_name,
    url: data.url,
    token: data.token,
    duration_minutes: data.duration_minutes ?? input.durationMinutes,
    participant_name: data.participant_name,
    unique_id: data.unique_id,
  }
}

export async function dispatchAgentOnTokenServer(input: {
  roomName: string
  agentName: string
}): Promise<void> {
  await tokenServerFetch(
    '/dispatch',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        room_name: input.roomName,
        agent_name: input.agentName,
      }),
    },
    'AI_TUTOR_TOKEN_SERVER_DISPATCH_FAILED',
  )
}

export async function endSessionOnTokenServer(
  sessionId: string,
): Promise<void> {
  await tokenServerFetch(
    '/end',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    },
    'AI_TUTOR_TOKEN_SERVER_END_FAILED',
  )
}

export async function fetchTranscriptOnTokenServer(
  sessionId: string,
): Promise<TokenServerTranscriptResponse> {
  const response = await tokenServerFetch(
    `/transcript/${encodeURIComponent(sessionId)}`,
    { method: 'GET', headers: { Accept: 'application/json' } },
    'AI_TUTOR_TOKEN_SERVER_TRANSCRIPT_FAILED',
  )

  const data = (await response
    .json()
    .catch(() => null)) as Partial<TokenServerTranscriptResponse> | null

  const transcript = Array.isArray(data?.transcript) ? data.transcript : []
  return {
    transcript,
    total_entries: data?.total_entries,
  }
}
