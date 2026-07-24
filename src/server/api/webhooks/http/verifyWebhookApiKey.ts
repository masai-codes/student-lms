import { timingSafeEqual } from 'node:crypto'

import { ApiError } from '@/server/api/http/apiError'

/** Constant-time comparison so a wrong key can't be discovered byte-by-byte via timing. */
function keysMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/**
 * Authorize an inbound webhook request against a shared secret held in an env var.
 *
 * External systems must send the secret in the `x-api-key` header. If the env var
 * is unset the webhook is treated as disabled (503) rather than open. On any
 * mismatch or missing header a 401 is thrown. Throws `ApiError`, so callers should
 * run inside a try/catch that funnels through `mapThrownErrorToResponse`.
 */
export function verifyWebhookApiKey(
  request: Request,
  envVarName: string,
): void {
  const expectedKey = process.env[envVarName]?.trim()
  if (!expectedKey) {
    throw new ApiError(503, 'WEBHOOK_NOT_ENABLED')
  }

  const providedKey = request.headers.get('x-api-key')?.trim() ?? ''
  if (!providedKey || !keysMatch(providedKey, expectedKey)) {
    throw new ApiError(401, 'WEBHOOK_UNAUTHORIZED')
  }
}
