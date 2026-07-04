/**
 * Shared session configuration derived from environment variables.
 *
 * These throw immediately when required env vars are missing so a
 * misconfigured deployment fails loudly instead of silently behaving as
 * "no one is logged in".
 */

export function getCookieName(): string {
  const name = process.env.COOKIE_NAME || process.env.NEW_COOKIE_NAME
  if (!name) throw new Error('COOKIE_NAME (or NEW_COOKIE_NAME) env var is not set')
  return name
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET_KEY
  if (!secret) throw new Error('JWT_SECRET_KEY env var is not set')
  return secret
}
