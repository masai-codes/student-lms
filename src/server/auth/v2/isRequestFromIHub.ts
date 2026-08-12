export type EmailPortal = 'masai' | 'ihub' | 'iitj'

/**
 * Narrows a raw `users.client` string (or any other untyped value) to a known
 * EmailPortal. Unknown values fall back to 'masai' — safe default historically
 * (everything pre-iHub was Masai). Add new cases here when we onboard new clients.
 */
export function toEmailPortal(value: string | null | undefined): EmailPortal {
  if (value === 'ihub') return 'ihub'
  if (value === 'iitj') return 'iitj'
  return 'masai'
}

function getOriginsFromEnv(envVar: string): Set<string> {
  return new Set(
    (process.env[envVar] ?? '')
      .split(',')
      .map((o) => o.trim().toLowerCase())
      .filter(Boolean),
  )
}

function getIHubOrigins(): Set<string> {
  return getOriginsFromEnv('IHUB_ORIGINS')
}

function getIITJOrigins(): Set<string> {
  return getOriginsFromEnv('IITJ_ORIGINS')
}

function extractOriginFromUrl(url: string): string {
  if (!url) return ''
  try {
    return new URL(url).origin.toLowerCase()
  } catch {
    return ''
  }
}

/**
 * Resolves the portal ('masai' | 'ihub' | 'iitj') for a request. Resolution
 * order: the `X-App-Origin` header the client attaches to every same-origin
 * fetch, then a localhost port convention (dev), then the `Origin`/`Referer`
 * allowlists, then a Masai default.
 */
export function getEmailPortal(request: Request): EmailPortal {
  const origin = (request.headers.get('origin') ?? '').toLowerCase()
  const referer =
    request.headers.get('referer') ?? request.headers.get('referrer') ?? ''
  const refererOrigin = extractOriginFromUrl(referer)
  const xAppOrigin = (request.headers.get('x-app-origin') ?? '')
    .toLowerCase()
    .trim()

  if (xAppOrigin) {
    if (xAppOrigin === 'iitj' || xAppOrigin.includes('iitj')) return 'iitj'
    if (xAppOrigin === 'ihub' || xAppOrigin.includes('ihub')) return 'ihub'
    if (xAppOrigin === 'masai' || xAppOrigin.includes('masai')) return 'masai'
  }

  const useLocalhostTesting =
    process.env.TESTING_IHUB_LOCALHOST === 'true' ||
    process.env.NODE_ENV === 'development'

  if (useLocalhostTesting) {
    // Dev port convention: 3001 = Masai, 3002 = iHub, 3003 = IIT Jodhpur.
    if (
      origin.includes('localhost:3003') ||
      refererOrigin.includes('localhost:3003')
    )
      return 'iitj'
    if (
      origin.includes('localhost:3002') ||
      refererOrigin.includes('localhost:3002')
    )
      return 'ihub'
    if (
      origin.includes('localhost:3001') ||
      refererOrigin.includes('localhost:3001')
    )
      return 'masai'
  }

  const iitjAllowed = getIITJOrigins()
  if (origin && iitjAllowed.has(origin)) return 'iitj'
  if (refererOrigin && iitjAllowed.has(refererOrigin)) return 'iitj'

  const ihubAllowed = getIHubOrigins()
  if (origin && ihubAllowed.has(origin)) return 'ihub'
  if (refererOrigin && ihubAllowed.has(refererOrigin)) return 'ihub'

  return 'masai'
}

/**
 * Whether a request is on the iHub portal specifically. Prefer `getEmailPortal`
 * for three-way logic; this stays for the iHub-only branches (e.g. grandfathered
 * mobile-app access) that don't care about IIT Jodhpur.
 */
function isRequestFromIHub(request: Request): boolean {
  return getEmailPortal(request) === 'ihub'
}
