import type { AppOrigin } from '@/utils/appOrigin'
import { getAppOrigin } from '@/utils/appOrigin'

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

/**
 * Whether the current portal hides the Masai-only surfaces (MasaiVerse, Refer &
 * Earn, Chat, guided-tour icon, LevelUp, Practice Interviews, LMS support).
 * True for BOTH iHub and IIT Jodhpur — i.e. every non-Masai portal.
 *
 * NOTE: the Download App action is gated separately on {@link isIHubPortal} —
 * iHub hides it, but IIT Jodhpur KEEPS it, so don't fold it into this helper.
 */
export function hidesMasaiOnlyFeatures(): boolean {
  return !isMasaiPortal()
}
