import type { AppOrigin } from '@/utils/appOrigin'
import { getAppOrigin } from '@/utils/appOrigin'
import { portalHasMobileApp } from '@/utils/portalCapabilities'

/**
 * Frontend portal helpers. Thin, reusable wrappers over {@link getAppOrigin}
 * (which derives 'masai' | 'ihub' from the runtime domain) so components read
 * one intent-revealing predicate instead of re-comparing origins.
 */
export function getPortal(): AppOrigin {
  return getAppOrigin()
}

/** Whether the app is currently running on the iHub portal (domain contains "ihub"). */
export function isIHubPortal(): boolean {
  return getAppOrigin() === 'ihub'
}

/** Whether the app is currently running on the Masai portal (everything else). */
export function isMasaiPortal(): boolean {
  return getAppOrigin() === 'masai'
}

/** Whether the app is currently running on the IIT Jodhpur portal. */
export function isIITJPortal(): boolean {
  return getAppOrigin() === 'iitj'
}

/**
 * Whether the current portal hides the Masai-only surfaces (MasaiVerse, Refer &
 * Earn, Chat, guided-tour icon, LevelUp, Practice Interviews, LMS support,
 * Download App). True for BOTH iHub and IIT Jodhpur — i.e. every non-Masai
 * portal.
 */
export function hidesMasaiOnlyFeatures(): boolean {
  return !isMasaiPortal()
}

/**
 * Whether the mobile app (Masai Learn) exists for the portal we're running on —
 * gates the navbar "Download App" action and the download-app guided-tour step.
 * The allowlist lives in `MOBILE_APP_PORTALS` (`@/utils/portalCapabilities`) —
 * add or remove portals there, not here.
 */
export function isMobileAppPortal(): boolean {
  return portalHasMobileApp(getAppOrigin())
}
