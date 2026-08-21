import { AI_TUTOR_API } from '@/lib/api/ai-tutor/aiTutorPaths'
import { createSseFrameBuffer } from '@/lib/api/sse/sseFrameBuffer'
import type { PracticeQuestionsPayload } from '@/server/api/ai-tutor/types/practiceQuestions'
import { parsePracticeQuestionsPayload } from '@/server/api/ai-tutor/types/practiceQuestions'

export { createSseFrameBuffer }

/** Wire events emitted by `POST /api/ai-tutor/chat/stream`. */
type ChatStreamEvent =
  | { type: 'token'; content: string }
  | { type: 'practiceQuestions'; payload: PracticeQuestionsPayload }
  | { type: 'done'; chatId: number }

export type LectureAiChatPlatform = 'web-desktop' | 'web-mobile'

export type StreamLectureAiChatRequest = {
  lectureId: number
  chat: string
  platform: LectureAiChatPlatform
  /** Omitted on the first message; echoed back on every follow-up. */
  chatId?: number
  /** Language the assistant should reply in (e.g. "English", "Hindi"). */
  language?: string
  /** Structured UI elements the caller can render (e.g. `['quiz']`). Omitted means none — the assistant writes everything as plain text. */
  supportedUIElements?: string[]
}

export type StreamLectureAiChatHandlers = {
  /** Fired once, on the first streamed token (flip "thinking" → "streaming"). */
  onFirstChunk?: () => void
  onChunk: (content: string) => void
  /** Fired when the assistant generated practice questions instead of (or alongside) text. */
  onPracticeQuestions?: (payload: PracticeQuestionsPayload) => void
  onComplete: (chatId: number | null) => void
  onError: (code: string) => void
}

/** Synthetic code surfaced when the transport (not the server) failed. */
const STREAM_GENERIC_ERROR = 'AI_TUTOR_CHAT_STREAM_FAILED'

function parseEvent(payload: string): ChatStreamEvent | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(payload)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null
  const record = parsed as {
    type?: unknown
    content?: unknown
    payload?: unknown
    chatId?: unknown
  }

  if (record.type === 'token') {
    return {
      type: 'token',
      content: typeof record.content === 'string' ? record.content : '',
    }
  }
  if (record.type === 'practiceQuestions') {
    const payload = parsePracticeQuestionsPayload(record.payload)
    return payload ? { type: 'practiceQuestions', payload } : null
  }
  if (record.type === 'done') {
    return {
      type: 'done',
      chatId: typeof record.chatId === 'number' ? record.chatId : 0,
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
 * Opens the lecture AI-chat SSE stream and dispatches token/done/error events.
 * Returns a function that aborts the in-flight stream (callbacks stop firing).
 */
export function streamLectureAiChat(
  request: StreamLectureAiChatRequest,
  handlers: StreamLectureAiChatHandlers,
): () => void {
  const controller = new AbortController()
  void runStream(request, handlers, controller.signal)
  return () => controller.abort()
}

async function runStream(
  request: StreamLectureAiChatRequest,
  handlers: StreamLectureAiChatHandlers,
  signal: AbortSignal,
): Promise<void> {
  let response: Response
  try {
    response = await fetch(AI_TUTOR_API.chatStream, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        lectureId: request.lectureId,
        chat: request.chat,
        platform: request.platform,
        ...(request.chatId != null ? { chatId: request.chatId } : {}),
        ...(request.language != null ? { language: request.language } : {}),
        ...(request.supportedUIElements != null
          ? { supportedUIElements: request.supportedUIElements }
          : {}),
      }),
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
  let sawFirstChunk = false
  let completed = false

  try {
    let result = await reader.read()
    while (!result.done) {
      const text = decoder.decode(result.value, { stream: true })
      for (const payload of frameBuffer.push(text)) {
        const event = parseEvent(payload)
        if (!event) continue

        if (event.type === 'token') {
          if (!sawFirstChunk) {
            sawFirstChunk = true
            handlers.onFirstChunk?.()
          }
          handlers.onChunk(event.content)
        } else if (event.type === 'practiceQuestions') {
          if (!sawFirstChunk) {
            sawFirstChunk = true
            handlers.onFirstChunk?.()
          }
          handlers.onPracticeQuestions?.(event.payload)
        } else {
          completed = true
          handlers.onComplete(event.chatId)
        }
      }
      result = await reader.read()
    }
  } catch {
    if (signal.aborted) return
    if (!completed) handlers.onError(STREAM_GENERIC_ERROR)
    return
  }

  // Stream closed cleanly but without an explicit `done` event.
  if (!completed && !signal.aborted) {
    handlers.onComplete(null)
  }
}
