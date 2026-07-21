import { getOldStudentUiUrlFromEnv } from '@/utils/viteEnv'

export function getOldStudentUiUrl() {
  return getOldStudentUiUrlFromEnv()
}

/**
 * Enables legacy student UI redirects when set to a truthy value
 * (true/1/yes/on). Defaults to false when unset.
 */
export function isLegacyStudentRedirectEnabled(): boolean {
  const value = (
    import.meta.env.VITE_ENABLE_LEGACY_STUDENT_REDIRECT as string | undefined
  )
    ?.trim()
    .toLowerCase()
  return value === 'true' || value === '1' || value === 'yes' || value === 'on'
}

type RedirectDebugContext = {
  source: string
  reason: string
  extra?: Record<string, unknown>
}

/** Full URL to a path on the legacy student app (base URL resolved per origin). Edit paths in `AppNavbar` as needed. */
export function getOldStudentUiUrlForPath(path: string): string | undefined {
  const base = getOldStudentUiUrl()?.trim()
  if (!base) return undefined
  const normalizedBase = base.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

/** Auto-redirect protected routes to legacy LMS (off unless `VITE_ENABLE_LEGACY_STUDENT_REDIRECT=true`). */
export function getLegacyProtectedRouteRedirectUrl(
  path: string,
): string | undefined {
  if (!isLegacyStudentRedirectEnabled()) return undefined
  return getOldStudentUiUrlForPath(path)
}

export function redirectToOldStudentUi(context?: RedirectDebugContext) {
  const studentUiUrl = getOldStudentUiUrl()
  const debugInfo = {
    timestamp: new Date().toISOString(),
    source: context?.source ?? 'unknown',
    reason: context?.reason ?? 'unspecified',
    targetUrl: studentUiUrl ?? null,
    currentUrl: typeof window !== 'undefined' ? window.location.href : null,
    pathname: typeof window !== 'undefined' ? window.location.pathname : null,
    search: typeof window !== 'undefined' ? window.location.search : null,
    hash: typeof window !== 'undefined' ? window.location.hash : null,
    referrer: typeof document !== 'undefined' ? document.referrer : null,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    historyLength: typeof window !== 'undefined' ? window.history.length : null,
    legacyUiConfigured: Boolean(studentUiUrl),
    envLegacyUiUrl: getOldStudentUiUrlFromEnv() ?? null,
    extra: context?.extra ?? null,
  }

  console.info('[redirectToOldStudentUi] Redirect requested', debugInfo)

  if (!studentUiUrl) {
    console.warn(
      '[redirectToOldStudentUi] Missing legacy student app URL for this origin',
      debugInfo,
    )
    return
  }

  window.location.assign(studentUiUrl)
}

/** After server logout: send the user to legacy student app, or `/signin` here if unset. */
export function getPostLogoutRedirectUrl(): string {
  const base = getOldStudentUiUrl()?.trim().replace(/\/$/, '')
  if (base) return `${base}/`
  return '/signin'
}
