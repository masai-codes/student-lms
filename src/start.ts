import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from '@tanstack/react-start'

/**
 * CORS: allow any `*.masaischool.com` / `*.iasam.dev` domain (and localhost in
 * dev) to call this app's API with credentials.
 *
 * The API is served from https://learn.masaischool.com and is consumed
 * cross-origin from other Masai subdomains (e.g. https://students.masaischool.com).
 * The session cookie is already scoped to `.masaischool.com`
 * (`SameSite=None; Secure`, see src/server/auth/v2/createSession.ts), so the
 * browser sends it cross-subdomain — we only need to advertise the matching
 * CORS response headers here.
 *
 * Credentialed CORS requires echoing the *specific* Origin (never `*`) together
 * with `Access-Control-Allow-Credentials: true`.
 */

const ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
const DEFAULT_ALLOWED_HEADERS = 'Content-Type, Authorization'
const PREFLIGHT_MAX_AGE = '86400'

/** Apex domains whose sites (and any subdomain) may call this API over https. */
const ALLOWED_DOMAINS = ['masaischool.com', 'iasam.dev']

/** Whether `hostname` is one of the allowed apex domains or a subdomain of one. */
function isAllowedHostname(hostname: string): boolean {
  return ALLOWED_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  )
}

/** Whether `origin` is an allowed domain (any subdomain depth) over https, or localhost in dev. */
function isAllowedOrigin(origin: string): boolean {
  let url: URL
  try {
    url = new URL(origin)
  } catch {
    return false
  }

  const { hostname, protocol } = url

  if (hostname === 'localhost' || hostname === '127.0.0.1') return true

  return isAllowedHostname(hostname) && protocol === 'https:'
}

/** Headers shared by preflight and actual cross-origin responses. */
function applyCorsHeaders(headers: Headers, origin: string): void {
  headers.set('Access-Control-Allow-Origin', origin)
  headers.set('Access-Control-Allow-Credentials', 'true')
  headers.append('Vary', 'Origin')
}

const corsMiddleware = createMiddleware().server(async (ctx) => {
  const origin = ctx.request.headers.get('Origin')

  // Same-origin requests send no Origin header — nothing to do.
  if (!origin || !isAllowedOrigin(origin)) return ctx.next()

  // Preflight: answer immediately with a 204 and the allow-* headers. TanStack
  // file routes only register GET/POST handlers, so an OPTIONS request would
  // otherwise fall through to the router and fail the browser's preflight.
  if (ctx.request.method === 'OPTIONS') {
    const headers = new Headers()
    applyCorsHeaders(headers, origin)
    headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS)
    headers.set(
      'Access-Control-Allow-Headers',
      ctx.request.headers.get('Access-Control-Request-Headers') ??
        DEFAULT_ALLOWED_HEADERS,
    )
    headers.set('Access-Control-Max-Age', PREFLIGHT_MAX_AGE)
    headers.append('Vary', 'Access-Control-Request-Headers')
    return new Response(null, { status: 204, headers })
  }

  // Actual request: run the chain, then decorate whatever response came back
  // (including error responses) with the CORS headers.
  const result = await ctx.next()
  if (result.response instanceof Response) {
    try {
      applyCorsHeaders(result.response.headers, origin)
    } catch {
      // Some responses (e.g. locked/immutable) reject header mutation; ignore.
    }
  }
  return result
})

// Replicates the framework default that is otherwise auto-injected only when no
// custom start entry exists. Keep it so server functions stay CSRF-protected.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
})

export const startInstance = createStart(() => ({
  // CORS runs first so it can decorate the response on the way back out — even
  // if CSRF (or any later middleware) short-circuits with an error.
  requestMiddleware: [corsMiddleware, csrfMiddleware],
}))
