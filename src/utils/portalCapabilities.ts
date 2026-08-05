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

/**
 * Portals that get the Chat surface (navbar icon + mobile tab bar entry, both
 * of which hand off to the old student UI). Masai and IIT Jodhpur students both
 * have chat; iHub does not.
 */
export const CHAT_PORTALS: ReadonlyArray<AppOrigin> = ['masai', 'iitj']

/** Whether Chat is available for `portal`. */
export function portalHasChat(portal: AppOrigin): boolean {
  return CHAT_PORTALS.includes(portal)
}

/**
 * Portals that get the hardcoded "Masai Live" promo pinned as the first slide of
 * the dashboard welcome carousel. It advertises a Masai-branded live session, so
 * IIT Jodhpur students don't see it.
 */
export const MASAI_LIVE_PROMO_PORTALS: ReadonlyArray<AppOrigin> = [
  'masai',
  'ihub',
]

/** Whether the pinned Masai Live promo banner shows for `portal`. */
export function portalHasMasaiLivePromo(portal: AppOrigin): boolean {
  return MASAI_LIVE_PROMO_PORTALS.includes(portal)
}

/**
 * Portals that show the section label as an extra chip on `/learn` listing cards
 * (after the type/category/module tags). IIT Jodhpur students take the same
 * course across several sections and need to tell the listings apart; Masai and
 * iHub students would only see a redundant chip.
 */
export const SECTION_ON_LEARN_CARD_PORTALS: ReadonlyArray<AppOrigin> = ['iitj']

/** Whether `/learn` listing cards show the section chip for `portal`. */
export function portalShowsSectionOnLearnCard(portal: AppOrigin): boolean {
  return SECTION_ON_LEARN_CARD_PORTALS.includes(portal)
}
