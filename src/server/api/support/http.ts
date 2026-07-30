/**
 * Support module — HTTP glue shared by every handler.
 *
 * Services throw plain `Error(CODE)` strings (so they stay transport-agnostic
 * and unit-testable). Handlers call {@link mapSupportError} to turn those codes
 * into proper HTTP responses, and {@link readJsonBody} to parse + validate POST
 * bodies with Zod.
 *
 * This is the one place that knows how a support error code maps to a status.
 */

import type { z } from 'zod'
import { isApiError } from '@/server/api/http/apiError'
import { jsonError } from '@/server/api/http/responses'

/** Known support error codes → HTTP status. Anything else is a 500. */
const SUPPORT_ERROR_STATUS: Record<string, number> = {
  SUPPORT_TICKET_NOT_FOUND: 404,
  SUPPORT_FAQ_NOT_FOUND: 404,
  SUPPORT_MESSAGE_REQUIRED: 400,
  SUPPORT_INVALID_RATING: 400,
  SUPPORT_REPLY_NOT_ALLOWED: 409,
  SUPPORT_RATE_NOT_ALLOWED: 409,
  SUPPORT_REOPEN_NOT_ALLOWED: 409,
  SUPPORT_ESCALATE_NOT_ALLOWED: 409,
  SUPPORT_CALLBACK_DUPLICATE: 409,
  SUPPORT_BATCH_REQUIRED: 400,
  SUPPORT_INVALID_BODY: 400,
  SUPPORT_LECTURE_NOT_FOUND: 404,
  SUPPORT_INVALID_LECTURE_ID: 400,
  SUPPORT_ASSIGNMENT_NOT_FOUND: 404,
  SUPPORT_INVALID_ASSIGNMENT_ID: 400,
  SUPPORT_RESOURCE_NOT_FOUND: 404,
  SUPPORT_INVALID_ENTITY_CATEGORY: 400,
  SUPPORT_INVALID_ENTITY_ID: 400,
  SUPPORT_ENTITY_BATCH_NOT_FOUND: 404,
}

/**
 * Map any thrown error to a `Response`. Recognised support codes and 401
 * `ApiError`s become clean client errors; everything else is logged + 500.
 */
export function mapSupportError(error: unknown): Response {
  if (isApiError(error))
    return jsonError(error.status, error.code, error.message)

  if (error instanceof Error && SUPPORT_ERROR_STATUS[error.message]) {
    return jsonError(SUPPORT_ERROR_STATUS[error.message], error.message)
  }

  console.error('[support] unexpected error', error)
  return jsonError(500, 'SUPPORT_SERVER_ERROR')
}

/** Parse + validate a JSON request body, throwing a 400 code on mismatch. */
export async function readJsonBody<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  const raw = await request.json().catch(() => null)
  const parsed = schema.safeParse(raw)
  if (!parsed.success) throw new Error('SUPPORT_INVALID_BODY')
  return parsed.data
}

/** Read a required positive integer query param, or throw `code`. */
export function requireIntParam(url: URL, name: string, code: string): number {
  const value = Number(url.searchParams.get(name))
  if (!Number.isFinite(value) || value <= 0) throw new Error(code)
  return value
}

/** Read an optional positive integer query param. */
export function optionalIntParam(url: URL, name: string): number | undefined {
  const raw = url.searchParams.get(name)
  if (raw == null || raw === '') return undefined
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : undefined
}
