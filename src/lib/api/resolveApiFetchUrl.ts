/** Origin for server-side `fetch` when no browser `window` exists (SSR loaders). */
function readServerOriginFromEnv(): string {
  const fromVite = import.meta.env.VITE_NEW_STUDENT_UI_URL as string | undefined
  if (typeof fromVite === 'string' && fromVite.trim() !== '') {
    return fromVite.trim().replace(/\/$/, '')
  }
  return 'http://127.0.0.1:3002'
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

  return new URL(path, readServerOriginFromEnv()).href
}
