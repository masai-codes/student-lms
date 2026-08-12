import { INTERVIEWS_API } from '@/lib/api/interviews/interviewsPaths'
import { createSseFrameBuffer } from '@/lib/api/sse/sseFrameBuffer'
import type { CreateInterviewSessionResult } from '@/server/api/interviews/services/interviewSession.service'

/** Wire events emitted by `POST /api/interviews/sessions/stream`. */
type CreateInterviewSessionStreamEvent =
  | { type: 'audio-delta'; data: string }
  | { type: 'done'; result: CreateInterviewSessionResult }
  | { type: 'error'; code: string }

export type StreamCreateInterviewSessionHandlers = {
  onAudioDelta: (data: string) => void
  onDone: (result: CreateInterviewSessionResult) => void
  onError: (code: string) => void
}

/** Synthetic code surfaced when the transport (not the server) failed. */
const STREAM_GENERIC_ERROR = 'INTERVIEW_SESSION_CREATE_STREAM_FAILED'

function parseEvent(payload: string): CreateInterviewSessionStreamEvent | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(payload)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) return null
  const record = parsed as {
    type?: unknown
    data?: unknown
    result?: unknown
    code?: unknown
  }

  if (record.type === 'audio-delta') {
    return {
      type: 'audio-delta',
      data: typeof record.data === 'string' ? record.data : '',
    }
  }
  if (record.type === 'done') {
    return {
      type: 'done',
      result: record.result as CreateInterviewSessionResult,
    }
  }
  if (record.type === 'error') {
    return {
      type: 'error',
      code:
        typeof record.code === 'string' ? record.code : STREAM_GENERIC_ERROR,
    }
  }
  return null
}

async function parseErrorCode(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (body !== null && typeof body === 'object' && 'code' in body) {
      const code = (body as { code?: unknown }).code
      if (typeof code === 'string' && code) return code
    }
  } catch {
    // Non-JSON error body — fall through to the generic code.
  }
  return STREAM_GENERIC_ERROR
}

/**
 * Opens the create-session SSE stream and dispatches audio-delta/done/error
 * events — the opening greeting/question is generated AND spoken by the
 * model, streamed the same way a turn's response is. Returns a function that
 * aborts the in-flight stream (callbacks stop firing).
 */
export function streamCreateInterviewSession(
  topicId: string,
  language: string,
  handlers: StreamCreateInterviewSessionHandlers,
): () => void {
  const controller = new AbortController()
  void runStream(topicId, language, handlers, controller.signal)
  return () => controller.abort()
}

async function runStream(
  topicId: string,
  language: string,
  handlers: StreamCreateInterviewSessionHandlers,
  signal: AbortSignal,
): Promise<void> {
  let response: Response
  try {
    response = await fetch(INTERVIEWS_API.createSessionStream, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topicId, language }),
      signal,
    })
  } catch {
    if (signal.aborted) return
    handlers.onError(STREAM_GENERIC_ERROR)
    return
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!response.ok || !contentType.includes('text/event-stream')) {
    const code = await parseErrorCode(response)
    if (!signal.aborted) handlers.onError(code)
    return
  }

  if (!response.body) {
    if (!signal.aborted) handlers.onError(STREAM_GENERIC_ERROR)
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const frameBuffer = createSseFrameBuffer()
  let settled = false

  try {
    let result = await reader.read()
    while (!result.done) {
      const text = decoder.decode(result.value, { stream: true })
      for (const payload of frameBuffer.push(text)) {
        const event = parseEvent(payload)
        if (!event) continue

        if (event.type === 'audio-delta') {
          handlers.onAudioDelta(event.data)
        } else if (event.type === 'done') {
          settled = true
          handlers.onDone(event.result)
        } else {
          settled = true
          handlers.onError(event.code)
        }
      }
      result = await reader.read()
    }
  } catch {
    if (signal.aborted) return
    if (!settled) handlers.onError(STREAM_GENERIC_ERROR)
    return
  }

  // Stream closed cleanly but without an explicit done/error event.
  if (!settled && !signal.aborted) {
    handlers.onError(STREAM_GENERIC_ERROR)
  }
}
