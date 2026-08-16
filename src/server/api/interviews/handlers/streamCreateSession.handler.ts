import { isApiError } from '@/server/api/http/apiError'
import { requireSessionUserId } from '@/server/api/http/requireSessionUser'
import { mapThrownErrorToResponse } from '@/server/api/http/responses'
import {
  createSseResponse,
  createSseStreamFromEvents,
} from '@/server/api/http/sse'
import { parseCreateSessionRequest } from '@/server/api/interviews/handlers/parseCreateSessionRequest'
import {
  createInterviewSessionStream,
  type CreateInterviewSessionStreamEvent,
} from '@/server/api/interviews/services/interviewSession.service'

export type CreateInterviewSessionSseEvent =
  | CreateInterviewSessionStreamEvent
  | { type: 'error'; code: string }

/**
 * Turns any error the generator throws — including ones discovered deep
 * inside the model stream — into a terminal `error` event instead of
 * aborting the connection, so the client can still show the same friendly,
 * code-specific message it gets from the blocking endpoint.
 */
async function* toSseEvents(
  source: AsyncGenerator<CreateInterviewSessionStreamEvent>,
): AsyncGenerator<CreateInterviewSessionSseEvent> {
  try {
    for await (const event of source) yield event
  } catch (error) {
    if (isApiError(error)) {
      yield { type: 'error', code: error.code }
      return
    }
    console.error('Failed to stream interview session creation', error)
    yield { type: 'error', code: 'SERVER_ERROR_CREATING_INTERVIEW_SESSION' }
  }
}

export async function handleStreamCreateInterviewSession(
  request: Request,
): Promise<Response> {
  try {
    const userId = await requireSessionUserId()
    const { topicId, language, subtopics } =
      await parseCreateSessionRequest(request)

    const generator = createInterviewSessionStream(
      userId,
      topicId,
      language,
      subtopics,
    )

    // Pull the first value before committing to the SSE response: the
    // generator's daily-limit/topic validation runs before its first `yield`,
    // so a failure there still throws here and gets a normal JSON error
    // response — matching the blocking endpoint — instead of being buried
    // inside an already-started stream.
    const first = await generator.next()

    async function* rest(): AsyncGenerator<CreateInterviewSessionStreamEvent> {
      if (first.done) return
      yield first.value
      yield* generator
    }

    const stream = createSseStreamFromEvents(toSseEvents(rest()))
    return createSseResponse(stream)
  } catch (error) {
    if (!isApiError(error)) {
      console.error('Failed to start interview session creation stream', error)
      return mapThrownErrorToResponse(
        new Error('SERVER_ERROR_CREATING_INTERVIEW_SESSION'),
      )
    }
    return mapThrownErrorToResponse(error)
  }
}
