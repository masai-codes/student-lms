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
