import { withAppMobileHeaders } from '@/utils/appMobile'

export type AppOrigin = 'masai' | 'ihub'

const APP_ORIGIN_HEADER = 'X-App-Origin'
const DEFAULT_APP_ORIGIN: AppOrigin = 'masai'

function normalizeAppOrigin(value: string | undefined): AppOrigin {
  const normalized = value?.trim().toLowerCase()
  return normalized === 'ihub' ? 'ihub' : DEFAULT_APP_ORIGIN
}

export function getConfiguredAppOrigin(): AppOrigin {
  return normalizeAppOrigin(import.meta.env.VITE_APP_ORIGIN as string | undefined)
}

export function withAppOriginHeader(headers?: HeadersInit): Headers {
  const nextHeaders = new Headers(headers)
  nextHeaders.set(APP_ORIGIN_HEADER, getConfiguredAppOrigin())
  return nextHeaders
}

function withClientContextHeaders(headers?: HeadersInit): Headers {
  return withAppMobileHeaders(withAppOriginHeader(headers))
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

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
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
  }) as typeof fetch

  window.__masaiPatchedFetchForAppOrigin = true
}
