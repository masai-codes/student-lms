import { isApiError } from '@/server/api/http/apiError'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { mapThrownErrorToResponse } from '@/server/api/http/responses'
import {
  createSseResponse,
  createSseStreamFromEvents,
} from '@/server/api/http/sse'
import {
  parseAnswer,
  parseSessionId,
} from '@/server/api/interviews/handlers/parseSubmitTurnRequest'
import {
  submitInterviewTurnStream,
  type SubmitInterviewTurnStreamEvent,
} from '@/server/api/interviews/services/submitInterviewTurn.service'

export type SubmitInterviewTurnSseEvent =
  | SubmitInterviewTurnStreamEvent
  | { type: 'error'; code: string }

/**
 * Turns any error the generator throws — including ones discovered deep
 * inside the model stream, like an empty transcript, well after the SSE
 * response has already started — into a terminal `error` event instead of
 * aborting the connection, so the client can still show the same friendly,
 * code-specific message it gets from the blocking endpoint.
 */
async function* toSseEvents(
  source: AsyncGenerator<SubmitInterviewTurnStreamEvent>,
): AsyncGenerator<SubmitInterviewTurnSseEvent> {
  try {
    for await (const event of source) yield event
  } catch (error) {
    if (isApiError(error)) {
      yield { type: 'error', code: error.code }
      return
    }
    console.error('Failed to stream interview turn', error)
    yield { type: 'error', code: 'SERVER_ERROR_SUBMITTING_INTERVIEW_TURN' }
  }
}

export async function handleStreamSubmitInterviewTurn(
  request: Request,
  sessionIdParam: string | undefined,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const sessionId = parseSessionId(sessionIdParam)
    const answer = await parseAnswer(request)

    const generator = submitInterviewTurnStream({ userId, sessionId, answer })

    // Pull the first value before committing to the SSE response: the
    // generator's session/turn validation runs before its first `yield`, so
    // a failure there (e.g. session already completed) still throws here and
    // gets a normal JSON error response — matching the blocking endpoint —
    // instead of being buried inside an already-started stream.
    const first = await generator.next()

    async function* rest(): AsyncGenerator<SubmitInterviewTurnStreamEvent> {
      if (first.done) return
      yield first.value
      yield* generator
    }

    const stream = createSseStreamFromEvents(toSseEvents(rest()))
    return createSseResponse(stream)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to start interview turn stream', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_STREAMING_INTERVIEW_TURN'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
