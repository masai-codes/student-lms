export type AppMobilePlatform = 'ios' | 'android'

const APP_MOBILE_HEADER = 'X-App-Mobile'
const APP_MOBILE_PLATFORM_HEADER = 'X-App-Mobile-Platform'

/**
 * Set by a mobile-viewport browser (narrow screen). Distinct from
 * `X-App-Mobile`, which flags the native app and also gates auth
 * (`portalGate.isMobileRequest`). This one only tells the guided tour to serve
 * the `-app` walkthrough / program-onboarding sections on mobile web too.
 */
export const MOBILE_VIEWPORT_HEADER = 'X-Client-Mobile-Viewport'

/**
 * Session flag for "this tab is the native app shell". Exported because the
 * pre-paint theme script (`lib/theme/theme-script.ts`) must read it as a raw
 * string literal — it runs before any module code.
 */
export const APP_MOBILE_STORAGE_KEY = 'lms.appMobile'
const APP_MOBILE_PLATFORM_STORAGE_KEY = 'lms.appMobilePlatform'

/** `?isApp=true` — the query param the app shell appends to every entry URL. */
export const IS_APP_QUERY_KEY = 'isApp'
const PLATFORM_QUERY_KEY = 'platform'

export type AppMobileContext = {
  isMobile: boolean
  platform: AppMobilePlatform | null
}

function normalizePlatform(
  value: string | null | undefined,
): AppMobilePlatform | null {
  const normalized = value?.trim().toLowerCase()
  if (normalized === 'ios') return 'ios'
  if (normalized === 'android') return 'android'
  return null
}

function isTruthyFlag(value: string | null | undefined): boolean {
  const normalized = value?.trim().toLowerCase()
  return normalized === 'true' || normalized === '1'
}

function safeSessionStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

export function getAppMobileContext(): AppMobileContext {
  const storage = safeSessionStorage()
  if (!storage) return { isMobile: false, platform: null }

  const isMobile = storage.getItem(APP_MOBILE_STORAGE_KEY) === 'true'
  const platform = normalizePlatform(
    storage.getItem(APP_MOBILE_PLATFORM_STORAGE_KEY),
  )
  return { isMobile, platform }
}

/**
 * Reads `isApp` / `platform` from a query string and persists them to
 * `sessionStorage` so that subsequent requests within the session can
 * forward the `X-App-Mobile` / `X-App-Mobile-Platform` headers, even on
 * routes that no longer carry the original query params (e.g. after a
 * redirect from `/signin?isApp=true&platform=ios` to `/`).
 *
 * Should be invoked once during client-side boot.
 */
export function captureAppMobileContextFromUrl(search?: string): void {
  const storage = safeSessionStorage()
  if (!storage) return

  const queryString =
    typeof search === 'string'
      ? search
      : typeof window !== 'undefined'
        ? window.location.search
        : ''

  const params = new URLSearchParams(queryString)
  const hasIsAppParam = params.has(IS_APP_QUERY_KEY)
  if (!hasIsAppParam) return

  const isMobile = isTruthyFlag(params.get(IS_APP_QUERY_KEY))
  storage.setItem(APP_MOBILE_STORAGE_KEY, isMobile ? 'true' : 'false')

  const platform = normalizePlatform(params.get(PLATFORM_QUERY_KEY))
  if (platform) {
    storage.setItem(APP_MOBILE_PLATFORM_STORAGE_KEY, platform)
  } else if (!isMobile) {
    storage.removeItem(APP_MOBILE_PLATFORM_STORAGE_KEY)
  }
}

export function withAppMobileHeaders(headers?: HeadersInit): Headers {
  const nextHeaders = new Headers(headers)
  const { isMobile, platform } = getAppMobileContext()

  if (isMobile) {
    nextHeaders.set(APP_MOBILE_HEADER, 'true')
    if (platform) {
      nextHeaders.set(APP_MOBILE_PLATFORM_HEADER, platform)
    }
  }

  return nextHeaders
}
