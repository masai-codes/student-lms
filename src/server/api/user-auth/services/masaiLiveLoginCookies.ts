export const MASAI_LIVE_DEFAULT_REDIRECT = 'https://masai-live.masaischool.com'
export const CONNECT_SID_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Extract a named cookie value from a Set-Cookie header array.
 * Handles URL-encoded values (e.g. `s%3A…`) by returning the raw string.
 */
export function extractCookieValue(
  setCookieHeaders: string[] | undefined,
  cookieName: string,
): string | null {
  if (!setCookieHeaders) return null
  const prefix = `${cookieName}=`
  const header = setCookieHeaders.find((c) => c.startsWith(prefix))
  if (!header) return null
  return header.split(';')[0].slice(prefix.length) || null
}

export function frontendHomeForRedirect(): string {
  const configured = process.env.FRONTEND_URL?.trim().replace(/\/$/, '')
  return configured || '/'
}

/** Cookie domain shared by masai-live / admissions (e.g. `.masaischool.com`). */
export function getMasaiLiveCookieDomain(): string {
  try {
    const host = new URL(MASAI_LIVE_DEFAULT_REDIRECT).hostname
    const parts = host.split('.').filter(Boolean)
    if (parts.length >= 2) return `.${parts.slice(-2).join('.')}`
  } catch {
    // fall through
  }
  return process.env.NODE_ENV === 'production'
    ? '.masaischool.com'
    : '.iasam.dev'
}

export function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

/** Build the `connect.sid` Set-Cookie header for the shared Masai domain. */
export function buildMasaiLiveConnectSidCookie(connectSid: string): string {
  const value = encodeURIComponent(decodeCookieValue(connectSid))
  const maxAgeSec = Math.floor(CONNECT_SID_COOKIE_MAX_AGE_MS / 1000)
  return [
    `connect.sid=${value}`,
    'Path=/',
    `Domain=${getMasaiLiveCookieDomain()}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`,
  ].join('; ')
}
