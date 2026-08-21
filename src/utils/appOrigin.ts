import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequestHost } from '@tanstack/react-start/server'
import { MOBILE_VIEWPORT_HEADER, withAppMobileHeaders } from '@/utils/appMobile'
import { getIsMobileViewport } from '@/hooks/useIsMobileViewport'

export type AppOrigin = 'masai' | 'ihub' | 'iitj'

const APP_ORIGIN_HEADER = 'X-App-Origin'
const DEFAULT_APP_ORIGIN: AppOrigin = 'masai'

/**
 * Maps a host (domain/subdomain) to an app origin: anything containing "iitj"
 * is IIT Jodhpur, anything containing "ihub" is iHub, everything else falls
 * back to Masai. This is what lets us ship a single build for all portals — the
 * origin is derived from the request URL at runtime instead of being baked in
 * at build time.
 */
export function originFromHost(host: string | null | undefined): AppOrigin {
  const lower = host?.toLowerCase() ?? ''
  if (lower.includes('iitj')) return 'iitj'
  if (lower.includes('ihub')) return 'ihub'
  return DEFAULT_APP_ORIGIN
}

/**
 * Incoming request's Host header during SSR / server fns.
 *
 * `createIsomorphicFn` keeps the server-only `getRequestHost` import out of the
 * client bundle (TanStack Start strips the `.server()` body when bundling).
 */
const resolveServerHost = createIsomorphicFn()
  .client((): string | undefined => undefined)
  .server(() => {
    try {
      return getRequestHost() ?? undefined
    } catch {
      return undefined
    }
  })

/**
 * Current app origin, derived from the request URL at runtime:
 *  - browser: `window.location.hostname`
 *  - SSR / server fns: the incoming request's Host header
 */
export function getAppOrigin(): AppOrigin {
  if (typeof window !== 'undefined') {
    return originFromHost(window.location.hostname)
  }
  return originFromHost(resolveServerHost())
}

export function withAppOriginHeader(headers?: HeadersInit): Headers {
  const nextHeaders = new Headers(headers)
  nextHeaders.set(APP_ORIGIN_HEADER, getAppOrigin())
  return nextHeaders
}

/**
 * Flags a mobile-viewport browser so guided-tour content resolves to the `-app`
 * sections outside the native app. Kept separate from `X-App-Mobile` on purpose
 * (that header also gates auth).
 */
function withMobileViewportHeader(headers?: HeadersInit): Headers {
  const nextHeaders = new Headers(headers)
  if (getIsMobileViewport()) {
    nextHeaders.set(MOBILE_VIEWPORT_HEADER, 'true')
  }
  return nextHeaders
}

function withClientContextHeaders(headers?: HeadersInit): Headers {
  return withMobileViewportHeader(
    withAppMobileHeaders(withAppOriginHeader(headers)),
  )
}

function isSameOriginRequest(input: RequestInfo | URL): boolean {
  if (typeof window === 'undefined') return false

  const rawUrl =
    input instanceof Request
      ? input.url
      : input instanceof URL
        ? input.href
        : String(input)

  try {
    const resolvedUrl = new URL(rawUrl, window.location.origin)
    return resolvedUrl.origin === window.location.origin
  } catch {
    return false
  }
}

declare global {
  interface Window {
    __masaiPatchedFetchForAppOrigin?: boolean
  }
}

export function installAppOriginFetchHeader(): void {
  if (typeof window === 'undefined' || window.__masaiPatchedFetchForAppOrigin) {
    return
  }

  const originalFetch = window.fetch.bind(window)

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    if (!isSameOriginRequest(input)) {
      return originalFetch(input, init)
    }

    if (input instanceof Request) {
      const requestWithHeader = new Request(input, {
        ...init,
        headers: withClientContextHeaders(init?.headers ?? input.headers),
      })
      return originalFetch(requestWithHeader)
    }

    return originalFetch(input, {
      ...init,
      headers: withClientContextHeaders(init?.headers),
    })
  }

  window.__masaiPatchedFetchForAppOrigin = true
}
