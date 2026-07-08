import { getRequest } from '@tanstack/react-start/server'
import type { EmailPortal } from '@/server/auth/v2/isRequestFromIHub'
import { getEmailPortal } from '@/server/auth/v2/isRequestFromIHub'

/**
 * Server-side portal ('masai' | 'ihub') for the *current* request. This is the
 * backend counterpart to the frontend's `getAppOrigin()`: it lets any service
 * decide iHub-vs-Masai behaviour without threading the request through by hand.
 *
 * Resolution order (see `isRequestFromIHub`): the `X-App-Origin` header the
 * client attaches to every same-origin fetch, then the `Origin`/`Referer`
 * allowlist, then a Masai default.
 *
 * Falls back to 'masai' when there is no ambient request (e.g. unit tests,
 * background jobs) — the historically safe default.
 */
export function getRequestPortal(): EmailPortal {
  try {
    return getEmailPortal(getRequest())
  } catch {
    return 'masai'
  }
}

/** Whether the current request is on the iHub portal. */
export function isIHubPortalRequest(): boolean {
  return getRequestPortal() === 'ihub'
}
