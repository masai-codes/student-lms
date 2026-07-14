import { getAppOrigin } from '@/utils/appOrigin'
import { ORIGIN_URLS } from '@/utils/originUrls'

/** Origin for server-side `fetch` when no browser `window` exists (SSR loaders). */
function readServerOrigin(): string {
  const base = ORIGIN_URLS[getAppOrigin()].newStudentUi
    .trim()
    .replace(/\/$/, '')
  return base || 'http://127.0.0.1:3002'
}

/**
 * Turn `/api/...` paths into absolute URLs.
 * Browsers accept relative paths; Node `fetch` does not.
 */
export function resolveApiFetchUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  if (typeof window !== 'undefined') {
    return new URL(path, window.location.origin).href
  }

  return new URL(path, readServerOrigin()).href
}
