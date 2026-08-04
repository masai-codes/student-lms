import type { AppOrigin } from '@/utils/appOrigin'

/**
 * Portal capability allowlists — the single source of truth shared by the
 * frontend (`@/utils/portal`) and the backend (`@/server/auth/v2/portalContext`)
 * so both sides can never disagree about which portals get a feature.
 *
 * Deliberately allowlists rather than "not X" checks: onboarding a new portal
 * then means adding it to the lists it should have, instead of hunting down
 * every negated branch.
 *
 * This module is import-safe from both client and server — it holds data only,
 * no request/window access.
 */

/**
 * Portals the Masai Learn mobile app ships for. Today only Masai students have
 * an app, so iHub and IIT Jodhpur hide the navbar "Download App" action and drop
 * the download-app guided-tour step (from numerator *and* denominator).
 * Add a portal here when the app becomes available to it.
 */
export const MOBILE_APP_PORTALS: ReadonlyArray<AppOrigin> = ['masai']

/** Whether the mobile app exists for `portal`. */
export function portalHasMobileApp(portal: AppOrigin): boolean {
  return MOBILE_APP_PORTALS.includes(portal)
}
