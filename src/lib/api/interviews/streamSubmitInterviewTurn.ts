import type { SubmitInterviewAnswerInput } from '@/lib/api/interviews/interviewsApi'
import { INTERVIEWS_API } from '@/lib/api/interviews/interviewsPaths'
import { createSseFrameBuffer } from '@/lib/api/sse/sseFrameBuffer'
import type { SubmitInterviewTurnResult } from '@/server/api/interviews/services/submitInterviewTurn.service'

/** Wire events emitted by `POST /api/interviews/sessions/$sessionId/turns/stream`. */
export type InterviewTurnStreamEvent =
  | { type: 'question-delta'; text: string }
  | { type: 'done'; result: SubmitInterviewTurnResult }
  | { type: 'error'; code: string }

export type StreamSubmitInterviewTurnHandlers = {
  onQuestionDelta: (text: string) => void
  onDone: (result: SubmitInterviewTurnResult) => void
  onError: (code: string) => void
}

/** Synthetic code surfaced when the transport (not the server) failed. */
const STREAM_GENERIC_ERROR = 'INTERVIEW_TURN_STREAM_FAILED'

function parseEvent(payload: string): InterviewTurnStreamEvent | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(payload)
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null) return null
  const record = parsed as {
    type?: unknown
    text?: unknown
    result?: unknown
    code?: unknown
  }

  if (record.type === 'question-delta') {
    return {
      type: 'question-delta',
      text: typeof record.text === 'string' ? record.text : '',
    }
  }
  if (record.type === 'done') {
    return { type: 'done', result: record.result as SubmitInterviewTurnResult }
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

function toFormData(answer: SubmitInterviewAnswerInput): FormData {
  const form = new FormData()
  if (answer.kind === 'audio') {
    form.append('audio', answer.blob, 'answer.wav')
  } else {
    form.append('typedAnswer', answer.text)
  }
  return form
}

/**
 * Opens the interview-turn SSE stream and dispatches question-delta/done/error
 * events. Returns a function that aborts the in-flight stream (callbacks stop
 * firing).
 */
export function streamSubmitInterviewTurn(
  sessionId: number | string,
  answer: SubmitInterviewAnswerInput,
  handlers: StreamSubmitInterviewTurnHandlers,
): () => void {
  const controller = new AbortController()
  void runStream(sessionId, answer, handlers, controller.signal)
  return () => controller.abort()
}

async function runStream(
  sessionId: number | string,
  answer: SubmitInterviewAnswerInput,
  handlers: StreamSubmitInterviewTurnHandlers,
  signal: AbortSignal,
): Promise<void> {
  let response: Response
  try {
    response = await fetch(INTERVIEWS_API.submitTurnStream(sessionId), {
      method: 'POST',
      credentials: 'same-origin',
      headers: { Accept: 'text/event-stream' },
      body: toFormData(answer),
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

        if (event.type === 'question-delta') {
          handlers.onQuestionDelta(event.text)
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
