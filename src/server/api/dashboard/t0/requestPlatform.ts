import type { GuidedTourPlatform } from './guidedTourProgress'

/**
 * Guided-tour content platform for a request: `'app'` when the mobile app
 * forwards `X-App-Mobile: true` (see `installAppOriginFetchHeader`), else
 * `'web'`. Kept db-free (unlike `portalGate.isMobileRequest`) so handlers can
 * use it without pulling the database module into their unit tests.
 */
export function guidedTourPlatformFromRequest(request: Request): GuidedTourPlatform {
  const value = request.headers.get('x-app-mobile')?.trim().toLowerCase()
  return value === 'true' || value === '1' ? 'app' : 'web'
}
