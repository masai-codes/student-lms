import type { GuidedTourPlatform } from './guidedTourProgress'
import { MOBILE_VIEWPORT_HEADER } from '@/utils/appMobile'

function isTruthyHeader(value: string | null): boolean {
  const normalized = value?.trim().toLowerCase()
  return normalized === 'true' || normalized === '1'
}

/**
 * Guided-tour content platform for a request: `'app'` when the native mobile app
 * forwards `X-App-Mobile: true`, OR when a mobile-viewport browser forwards
 * `X-Client-Mobile-Viewport: true` (see `installAppOriginFetchHeader`); else
 * `'web'`. This is what makes mobile — native app *and* mobile web — load the
 * `-app` walkthrough / program-onboarding sections; progress then records
 * against the `-app` denominator because the record path keys off the played
 * lecture's own section. Kept db-free (unlike `portalGate.isMobileRequest`) so
 * handlers can use it without pulling the database module into their unit tests.
 */
export function guidedTourPlatformFromRequest(
  request: Request,
): GuidedTourPlatform {
  const isNativeApp = isTruthyHeader(request.headers.get('x-app-mobile'))
  const isMobileViewport = isTruthyHeader(
    request.headers.get(MOBILE_VIEWPORT_HEADER),
  )
  return isNativeApp || isMobileViewport ? 'app' : 'web'
}
