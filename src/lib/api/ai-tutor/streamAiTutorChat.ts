import { AI_TUTOR_API } from '@/lib/api/ai-tutor/aiTutorPaths'

/** Wire events emitted by `POST /api/ai-tutor/chat/stream`. */
export type ChatStreamEvent =
  | { type: 'token'; content: string }
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
}

export type StreamLectureAiChatHandlers = {
  /** Fired once, on the first streamed token (flip "thinking" → "streaming"). */
  onFirstChunk?: () => void
  onChunk: (content: string) => void
  onComplete: (chatId: number | null) => void
  onError: (code: string) => void
}

/** Synthetic code surfaced when the transport (not the server) failed. */
const STREAM_GENERIC_ERROR = 'AI_TUTOR_CHAT_STREAM_FAILED'

/**
 * Pure buffer that reassembles SSE frames (delimited by a blank line) even when
 * a single frame is split across multiple network chunks. `push` returns the
 * `data:` payloads that became complete with this chunk. Kept side-effect free
 * so it can be unit-tested in isolation.
 */
export function createSseFrameBuffer() {
  let buffer = ''

  return {
    push(chunk: string): Array<string> {
      buffer += chunk
      const payloads: Array<string> = []

      let separatorIndex = buffer.indexOf('\n\n')
      while (separatorIndex !== -1) {
        const rawFrame = buffer.slice(0, separatorIndex)
        buffer = buffer.slice(separatorIndex + 2)
        const payload = extractDataPayload(rawFrame)
        if (payload !== null) payloads.push(payload)
        separatorIndex = buffer.indexOf('\n\n')
      }

      return payloads
    },
  }
}

/** Join the `data:` lines of one SSE frame (the spec allows several per event). */
function extractDataPayload(rawFrame: string): string | null {
  const dataLines = rawFrame
    .split('\n')
    .map((line) => line.replace(/\r$/, ''))
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice('data:'.length).replace(/^ /, ''))

  if (dataLines.length === 0) return null
  return dataLines.join('\n')
}

function parseEvent(payload: string): ChatStreamEvent | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(payload)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null) return null
  const record = parsed as { type?: unknown; content?: unknown; chatId?: unknown }

  if (record.type === 'token') {
    return {
      type: 'token',
      content: typeof record.content === 'string' ? record.content : '',
    }
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
