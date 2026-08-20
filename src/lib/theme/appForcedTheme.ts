import { isMasaiverseApp } from '@/constants/masaiverseDrawerUi'
import { getAppMobileContext, IS_APP_QUERY_KEY } from '@/utils/appMobile'

import { applyThemeToDocument } from './apply'
import { STORAGE_KEY } from './themes'
import type { ResolvedTheme } from './themes'

/** Inside the native app shell we pin light — the app chrome is light-only. */
export const APP_FORCED_PREFERENCE: ResolvedTheme = 'light'

/**
 * True when this tab is the native app shell: `window.isApp`, `?isApp=true` on
 * the current URL, or the session flag persisted by
 * `captureAppMobileContextFromUrl` (the param is dropped after redirects, so
 * the flag is what keeps later navigations recognised as app traffic).
 *
 * An explicit `?isApp=false` wins over the stale session flag.
 */
export function isAppShell(search?: string): boolean {
  if (typeof window === 'undefined') return false

  const queryString = search ?? window.location.search
  const rawParam = new URLSearchParams(queryString)
    .get(IS_APP_QUERY_KEY)
    ?.trim()
    .toLowerCase()

  if (rawParam !== undefined && rawParam !== null) {
    return rawParam === 'true' || rawParam === '1'
  }

  return isMasaiverseApp(queryString) || getAppMobileContext().isMobile
}

/**
 * Routes that are always light, regardless of the stored preference, the OS,
 * or `isApp` — chrome-less WebView pages whose content is authored light-only.
 * Matched by prefix so `/notes-preview-v2` (and any future variant) is covered.
 */
export const FORCED_LIGHT_PATH_PREFIXES = ['/notes-preview'] as const

export function isForcedLightPath(pathname?: string): boolean {
  const path =
    pathname ??
    (typeof window === 'undefined' ? '' : window.location.pathname) ??
    ''
  return FORCED_LIGHT_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))
}

/**
 * The single question the provider and the pre-paint script both ask: is the
 * theme pinned to light for this page?
 */
export function shouldForceLightTheme(
  search?: string,
  pathname?: string,
): boolean {
  return isForcedLightPath(pathname) || isAppShell(search)
}

/**
 * Pin light. Called from the theme provider's mount effect and again whenever
 * something tries to change the theme.
 *
 * `persist` writes `light` into `localStorage` — what the app shell wants, since
 * it must survive reloads and override a dark pin the user set in the browser
 * (same origin, same storage). Forced-light *routes* pass `false`: they only
 * need the current paint to be light and must not clobber the preference the
 * user gets back on the next normal page.
 */
export function forceLightTheme({ persist }: { persist: boolean }): void {
  if (persist) {
    try {
      window.localStorage.setItem(STORAGE_KEY, APP_FORCED_PREFERENCE)
    } catch {
      // Ignore persistence failures (private mode, quota) — theme still applies.
    }
  }
  applyThemeToDocument(APP_FORCED_PREFERENCE)
}

/** App-shell flavour: pins light and persists it. */
function forceLightThemeForApp(): void {
  forceLightTheme({ persist: true })
}
