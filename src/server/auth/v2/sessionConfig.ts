/**
 * Shared session configuration derived from environment variables.
 *
 * These throw immediately when required env vars are missing so a
 * misconfigured deployment fails loudly instead of silently behaving as
 * "no one is logged in".
 */

/** Sliding-window step (hours) for a normal login. */
export const DEFAULT_TTL_HOURS = 72
/** Sliding-window step (hours) for a "remember me" login. */
export const REMEMBER_ME_TTL_HOURS = 720
/**
 * Hard ceiling (hours) on how far a session's expiry can be pushed out by
 * renewal, measured from when it was originally authenticated. Even a
 * continuously-active session is forced to re-authenticate past this point.
 */
export const ABSOLUTE_MAX_TTL_HOURS = REMEMBER_ME_TTL_HOURS * 3

export function getCookieName(): string {
  const name = process.env.COOKIE_NAME || process.env.NEW_COOKIE_NAME
  if (!name)
    throw new Error('COOKIE_NAME (or NEW_COOKIE_NAME) env var is not set')
  return name
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET_KEY
  if (!secret) throw new Error('JWT_SECRET_KEY env var is not set')
  return secret
}
