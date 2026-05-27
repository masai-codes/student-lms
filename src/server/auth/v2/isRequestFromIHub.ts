export type EmailPortal = 'masai' | 'ihub'

/**
 * Narrows a raw `users.client` string (or any other untyped value) to a known
 * EmailPortal. Unknown values fall back to 'masai' — safe default historically
 * (everything pre-iHub was Masai). Add new cases here when we onboard new clients.
 */
export function toEmailPortal(value: string | null | undefined): EmailPortal {
  return value === 'ihub' ? 'ihub' : 'masai'
}

function getIHubOrigins(): Set<string> {
  return new Set(
    (process.env.IHUB_ORIGINS ?? '')
      .split(',')
      .map((o) => o.trim().toLowerCase())
      .filter(Boolean),
  )
}

function extractOriginFromUrl(url: string): string {
  if (!url) return ''
  try {
    return new URL(url).origin.toLowerCase()
  } catch {
    return ''
  }
}

export function isRequestFromIHub(request: Request): boolean {
  const origin = (request.headers.get('origin') ?? '').toLowerCase()
  const referer = request.headers.get('referer') ?? request.headers.get('referrer') ?? ''
  const xAppOrigin = (request.headers.get('x-app-origin') ?? '').toLowerCase().trim()

  if (xAppOrigin) {
    if (xAppOrigin === 'ihub' || xAppOrigin.includes('ihub')) return true
    if (xAppOrigin === 'masai' || xAppOrigin.includes('masai')) return false
  }

  const useLocalhostTesting =
    process.env.TESTING_IHUB_LOCALHOST === 'true' || process.env.NODE_ENV === 'development'

  if (useLocalhostTesting) {
    const refererOrigin = extractOriginFromUrl(referer)
    if (origin.includes('localhost:3002') || refererOrigin.includes('localhost:3002')) return true
    if (origin.includes('localhost:3001') || refererOrigin.includes('localhost:3001')) return false
  }

  const allowed = getIHubOrigins()
  if (origin && allowed.has(origin)) return true
  const refererOrigin = extractOriginFromUrl(referer)
  if (refererOrigin && allowed.has(refererOrigin)) return true

  return false
}

export function getEmailPortal(request: Request): EmailPortal {
  return isRequestFromIHub(request) ? 'ihub' : 'masai'
}
