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
