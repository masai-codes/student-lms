import { V2AuthRequestError } from '@/components/features/sign-in/v2AuthClient'

export type PortalMismatch = {
  portalLabel: string
  redirectUrl: string
}

/**
 * How long the "Taking you to <portal>…" message stays on screen before the
 * browser leaves. Long enough to read why the domain is about to change,
 * short enough not to feel stuck.
 */
const REDIRECT_DELAY_MS = 1500

/**
 * Only ever hand `location.assign` an absolute http(s) URL that came back as a
 * PORTAL_MISMATCH `redirectUrl`. The server builds it from `ORIGIN_URLS`, but it
 * arrives over the wire, so re-validate before navigating.
 */
function isSafeRedirectUrl(value: unknown): value is string {
  if (typeof value !== 'string' || value.trim() === '') return false
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

/**
 * Reads a PORTAL_MISMATCH error into the portal the student actually belongs to,
 * or `null` for every other failure (and for a mismatch the server couldn't
 * resolve a destination for — those keep the plain error message).
 */
export function getPortalMismatch(err: unknown): PortalMismatch | null {
  if (!(err instanceof V2AuthRequestError)) return null
  if (err.code !== 'PORTAL_MISMATCH') return null

  const { redirectUrl, portalLabel } = err.details
  if (!isSafeRedirectUrl(redirectUrl)) return null

  return {
    redirectUrl,
    portalLabel:
      typeof portalLabel === 'string' && portalLabel.trim() !== ''
        ? portalLabel
        : 'your portal',
  }
}

/**
 * Sends the browser to the student's own portal. `replace` (not `assign`) so
 * Back doesn't bounce them straight into the wrong portal's sign-in again.
 */
export function redirectToPortal(redirectUrl: string): void {
  if (typeof window === 'undefined') return
  window.setTimeout(() => {
    window.location.replace(redirectUrl)
  }, REDIRECT_DELAY_MS)
}
