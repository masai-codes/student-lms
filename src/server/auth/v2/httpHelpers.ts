export type ErrorBody = {
  error: {
    code: string
    message: string
  }
}

export function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
}

export function errorResponse(status: number, code: string, message: string): Response {
  const body: ErrorBody = { error: { code, message } }
  return jsonResponse(body, { status })
}

export async function readJsonBody<T = unknown>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T
  } catch {
    throw new BadRequestError('INVALID_JSON', 'Request body must be valid JSON')
  }
}

export class BadRequestError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
  }
}

/**
 * Wraps an auth route handler so no raw error ever reaches the client.
 *
 * Handlers convert their own *expected* failures (wrong password, OTP expired,
 * user not found, …) into structured `errorResponse`s. Anything that still
 * escapes — a DB outage, an SMS-provider failure, a `null` dereference — is
 * caught here: the real cause is logged for ops, and the user gets a single,
 * meaningful message instead of a leaked database/stack/null error.
 *
 * `BadRequestError` (malformed body) is handled here too, so individual
 * handlers can simply `await readJsonBody(...)` without their own try/catch.
 */
export function withAuthErrorHandling(
  context: string,
  handler: (request: Request) => Promise<Response>,
): (ctx: { request: Request }) => Promise<Response> {
  return async ({ request }) => {
    try {
      return await handler(request)
    } catch (err) {
      if (err instanceof BadRequestError) {
        return errorResponse(400, err.code, err.message)
      }
      console.error(`[auth:${context}] unexpected error:`, err)
      return errorResponse(
        500,
        'UNEXPECTED_ERROR',
        'Something went wrong on our end. Please try again in a moment.',
      )
    }
  }
}
