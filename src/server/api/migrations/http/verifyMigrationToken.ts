import { timingSafeEqual } from 'node:crypto'

import { ApiError } from '@/server/api/http/apiError'

/** Constant-time comparison so a wrong token can't be discovered byte-by-byte via timing. */
function tokensMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/**
 * Authorize an inbound migration request against `SECRET_LOGIN_TOKEN`.
 *
 * Migration endpoints are internal, operator-driven one-off DB fixes called by
 * hand (Postman/cURL) — there is no session. The operator must send the secret in
 * the `x-migration-token` header. If `SECRET_LOGIN_TOKEN` is unset, every
 * migration route is treated as disabled (503) rather than open. Throws
 * `ApiError`, so callers should run inside a try/catch that funnels through
 * `mapThrownErrorToResponse`.
 */
export function verifyMigrationToken(request: Request): void {
  const expectedToken = process.env.SECRET_LOGIN_TOKEN?.trim()
  if (!expectedToken) {
    throw new ApiError(503, 'MIGRATION_NOT_ENABLED')
  }

  const providedToken = request.headers.get('x-migration-token')?.trim() ?? ''
  if (!providedToken || !tokensMatch(providedToken, expectedToken)) {
    throw new ApiError(401, 'MIGRATION_UNAUTHORIZED')
  }
}
