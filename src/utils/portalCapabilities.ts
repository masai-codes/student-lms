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
 * Portals the Masai Learn mobile app ships for. Masai and IIT Jodhpur students
 * both get it; iHub has no app, so it hides the navbar "Download App" action and
 * drops the download-app guided-tour step (from numerator *and* denominator).
 * Add a portal here when the app becomes available to it.
 */
export const MOBILE_APP_PORTALS: ReadonlyArray<AppOrigin> = ['masai', 'iitj']

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
 * Portals that get the Support surface (navbar "Support" tab + mobile tab bar
 * entry, both of which hand off to the old student UI). IIT Jodhpur runs its own
 * support channel, so its students don't see the LMS one.
 */
export const SUPPORT_PORTALS: ReadonlyArray<AppOrigin> = ['masai', 'ihub']

/** Whether the Support surface is available for `portal`. */
export function portalHasSupport(portal: AppOrigin): boolean {
  return SUPPORT_PORTALS.includes(portal)
}

/**
 * Portals that get the ID-card capstone in the guided tour (the locked/unlocked
 * card beneath the Program Onboarding steps). IIT Jodhpur issues its own student
 * IDs, so its students see no card at all — neither locked nor unlocked.
 *
 * Unlike the other capabilities here, this one is keyed off the student's
 * `users.client` rather than the request domain: IITJ students can sign in
 * through the Masai mobile app (see `canAccessPortal`), so the domain alone
 * would leak the card back in.
 */
export const ID_CARD_PORTALS: ReadonlyArray<AppOrigin> = ['masai', 'ihub']

/** Whether the guided-tour ID-card capstone shows for `portal`. */
export function portalHasIdCard(portal: AppOrigin): boolean {
  return ID_CARD_PORTALS.includes(portal)
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
